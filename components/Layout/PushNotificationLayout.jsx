"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "firebase/messaging";
import FirebaseData from "../../utils/Firebase";
import { useDispatch, useSelector } from "react-redux";
import { setNotification } from "@/redux/reducer/globalStateSlice";
import { useNavigate } from "../Common/useNavigate";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import useRealtimeUserEvents from "@/hooks/useRealtimeUserEvents";

const PushNotificationLayout = ({ children }) => {
  const dispatch = useDispatch();
  const [fcmToken, setFcmToken] = useState("");
  const { fetchToken, onMessageListener } = FirebaseData();
  const { navigate } = useNavigate();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const unsubscribeRef = useRef(null);

  const emitRealtimeEvent = useCallback((detail) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("lmx:realtime-event", { detail }));
  }, []);

  const handleOpenChatFromPayload = useCallback(
    (payloadData = {}) => {
      const tab = payloadData?.user_type === "Seller" ? "buying" : "selling";
      navigate(`/chat?activeTab=${tab}&chatid=${payloadData?.item_offer_id}`);
    },
    [navigate]
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
          if (payload && payload.data) {
            dispatch(setNotification(payload.data));

            emitRealtimeEvent({
              category: payload.data?.type === "chat" ? "chat" : "notification",
              type: payload.data?.type || "notification",
              title: payload.notification?.title || "Obavijest",
              message: payload.notification?.body || payload.data?.body || "",
              payload: payload.data,
              created_at: new Date().toISOString(),
            });

            if (Notification.permission === "granted" && payload.notification?.title) {
              const notif = new Notification(payload.notification.title, {
                body: payload.notification?.body || "",
              });

              notif.onclick = () => {
                if (
                  payload.data.type === "chat" ||
                  payload.data.type === "offer"
                ) {
                  handleOpenChatFromPayload(payload.data);
                }
              };
            }
          }
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
  }, [isLoggedIn, dispatch, onMessageListener, emitRealtimeEvent, handleOpenChatFromPayload]);

  const handleRealtimeEvent = useCallback(
    (eventData) => {
      if (!eventData) return;

      const payload = eventData.payload || {};

      if (payload && typeof payload === "object" && payload.type) {
        dispatch(setNotification(payload));
      }

      emitRealtimeEvent(eventData);
    },
    [dispatch, emitRealtimeEvent]
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
