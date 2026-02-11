"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "firebase/messaging";
import FirebaseData from "../../utils/Firebase";
import { useDispatch, useSelector } from "react-redux";
import { setNotification } from "@/redux/reducer/globalStateSlice";
import { useNavigate } from "../Common/useNavigate";
import { getIsLoggedIn, userSignUpData } from "@/redux/reducer/authSlice";
import useRealtimeUserEvents from "@/hooks/useRealtimeUserEvents";
import { toast } from "sonner";

const CHAT_LIKE_TYPES = new Set([
  "chat",
  "message",
  "new_message",
  "offer",
  "counter_offer",
  "seen",
  "message_seen",
  "text",
]);

const buildSignature = (detail = {}) => {
  const payload = detail?.payload || {};
  return [
    detail?.category || "",
    detail?.type || "",
    detail?.title || "",
    detail?.message || "",
    payload?.notification_id || "",
    payload?.id || "",
    payload?.item_offer_id || payload?.chat_id || "",
  ].join("|");
};

const extractPathFromUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  if (raw.startsWith("/")) return raw;

  try {
    const parsed = new URL(raw);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
};

const PushNotificationLayout = ({ children }) => {
  const dispatch = useDispatch();
  const [fcmToken, setFcmToken] = useState("");
  const { fetchToken, onMessageListener } = FirebaseData();
  const { navigate } = useNavigate();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const currentUser = useSelector(userSignUpData);
  const unsubscribeRef = useRef(null);
  const eventTimestampsRef = useRef(new Map());

  const getCurrentUserId = useCallback(() => {
    return Number(
      currentUser?.id ??
        currentUser?.data?.id ??
        currentUser?.user?.id ??
        0
    );
  }, [currentUser]);

  const emitRealtimeEvent = useCallback((detail) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("lmx:realtime-event", { detail }));
  }, []);

  const isDuplicateEvent = useCallback((detail) => {
    const signature = buildSignature(detail);
    if (!signature) return false;

    const now = Date.now();
    const previous = eventTimestampsRef.current.get(signature);
    eventTimestampsRef.current.set(signature, now);

    for (const [key, timestamp] of eventTimestampsRef.current.entries()) {
      if (now - timestamp > 12000) {
        eventTimestampsRef.current.delete(key);
      }
    }

    return Number.isFinite(previous) && now - previous < 3500;
  }, []);

  const getChatPathFromPayload = useCallback((payloadData = {}) => {
    const chatId = payloadData?.item_offer_id || payloadData?.chat_id;
    if (!chatId) return "/chat";
    const tab = payloadData?.user_type === "Seller" ? "buying" : "selling";
    return `/chat?activeTab=${tab}&chatid=${chatId}`;
  }, []);

  const resolveTargetPath = useCallback(
    (detail = {}) => {
      const payload = detail?.payload || {};
      const normalizedType = String(
        detail?.type || payload?.type || ""
      ).toLowerCase();

      if (CHAT_LIKE_TYPES.has(normalizedType)) {
        return getChatPathFromPayload(payload);
      }

      const directPath =
        extractPathFromUrl(payload?.path) ||
        extractPathFromUrl(payload?.route) ||
        extractPathFromUrl(payload?.url) ||
        extractPathFromUrl(payload?.link);

      if (directPath) return directPath;

      const slug = payload?.item_slug || payload?.slug;
      if (slug) {
        const currentUserId = getCurrentUserId();
        const ownerId = Number(
          payload?.user_id || payload?.owner_id || payload?.seller_id || 0
        );
        if (currentUserId > 0 && ownerId > 0 && currentUserId === ownerId) {
          return `/my-listing/${slug}`;
        }
        return `/ad-details/${slug}`;
      }

      return "/notifications";
    },
    [getChatPathFromPayload, getCurrentUserId]
  );

  const maybeShowBrowserNotification = useCallback(
    (detail = {}) => {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return;
      }

      if (document.visibilityState === "visible") return;
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;

      const title = detail?.title || "Obavijest";
      const body = detail?.message || "";
      const targetPath = resolveTargetPath(detail);

      const browserNotification = new Notification(title, { body });
      browserNotification.onclick = () => {
        if (targetPath) navigate(targetPath);
      };
    },
    [navigate, resolveTargetPath]
  );

  const showRealtimePopup = useCallback(
    (detail = {}) => {
      const title = detail?.title || "Obavijest";
      const message = detail?.message || "Imate novu aktivnost.";
      const targetPath = resolveTargetPath(detail);

      toast.info(title, {
        description: message,
        duration: 6500,
        action: {
          label: "Otvori",
          onClick: () => {
            if (targetPath) navigate(targetPath);
          },
        },
      });

      maybeShowBrowserNotification(detail);
    },
    [maybeShowBrowserNotification, navigate, resolveTargetPath]
  );

  const processRealtimeEvent = useCallback(
    (detail = {}) => {
      if (!detail || isDuplicateEvent(detail)) return;

      const payload = detail?.payload || {};
      if (payload && typeof payload === "object" && payload.type) {
        dispatch(setNotification(payload));
      }

      emitRealtimeEvent(detail);
      showRealtimePopup(detail);
    },
    [dispatch, emitRealtimeEvent, isDuplicateEvent, showRealtimePopup]
  );

  const handleFetchToken = async () => {
    await fetchToken(setFcmToken);
  };

  // Fetch token when user logs in
  useEffect(() => {
    handleFetchToken();
  }, []);

  // Set up message listener when logged in, clean up when logged out
  useEffect(() => {
    if (!isLoggedIn) {
      // Clean up listener when user logs out
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Set up listener when user logs in
    const setupListener = async () => {
      try {
        unsubscribeRef.current = await onMessageListener((payload) => {
          if (!payload) return;

          const dataPayload =
            payload.data && typeof payload.data === "object" ? payload.data : {};

          processRealtimeEvent({
            category: dataPayload?.type === "chat" ? "chat" : "notification",
            type: dataPayload?.type || "notification",
            title: payload.notification?.title || "Obavijest",
            message: payload.notification?.body || dataPayload?.body || "",
            payload: dataPayload,
            created_at: new Date().toISOString(),
          });
        });
      } catch (err) {
        console.error("Error handling foreground notification:", err);
      }
    };

    setupListener();

    // Cleanup on unmount or logout
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isLoggedIn, onMessageListener, processRealtimeEvent]);

  const handleRealtimeEvent = useCallback(
    (eventData) => {
      if (!eventData) return;
      processRealtimeEvent(eventData);
    },
    [processRealtimeEvent]
  );

  useRealtimeUserEvents({ onEvent: handleRealtimeEvent });

  useEffect(() => {
    if (fcmToken) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then((registration) => {
            console.log(
              "Service Worker registration successful with scope: ",
              registration.scope
            );
          })
          .catch((err) => {
            console.log("Service Worker registration failed: ", err);
          });
      }
    }
  }, [fcmToken]);

  return children;
};

export default PushNotificationLayout;
