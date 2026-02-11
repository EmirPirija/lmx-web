"use client";

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import Pusher from "pusher-js";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";

const normalizeEvent = (eventData = {}) => {
  if (!eventData || typeof eventData !== "object") return null;

  return {
    category: eventData.category || "notification",
    type: eventData.type || "general",
    title: eventData.title || "Obavijest",
    message: eventData.message || "",
    payload:
      eventData.payload && typeof eventData.payload === "object"
        ? eventData.payload
        : {},
    created_at: eventData.created_at || new Date().toISOString(),
  };
};

const parsePort = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export default function useRealtimeUserEvents({ onEvent } = {}) {
  const isLoggedIn = useSelector(getIsLoggedIn);
  const authState = useSelector((state) => state?.UserSignup?.data);
  const pusherRef = useRef(null);
  const channelRef = useRef(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const userId = authState?.data?.id;
    const token = authState?.token;

    if (!isLoggedIn || !userId || !token) return;

    const key = process.env.NEXT_PUBLIC_REVERB_APP_KEY;
    const host = process.env.NEXT_PUBLIC_REVERB_HOST;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const scheme = String(process.env.NEXT_PUBLIC_REVERB_SCHEME || "https").toLowerCase();

    if (!key || !host || !apiUrl) return;

    const wsPort = parsePort(process.env.NEXT_PUBLIC_REVERB_PORT, 80);
    const wssPort = parsePort(process.env.NEXT_PUBLIC_REVERB_PORT, 443);
    const forceTLS = scheme === "wss" || scheme === "https";
    const channelName = `private-user.${userId}`;

    const pusher = new Pusher(key, {
      wsHost: host,
      wsPort,
      wssPort,
      forceTLS,
      encrypted: forceTLS,
      disableStats: true,
      enabledTransports: ["ws", "wss"],
      cluster: "mt1",
      authEndpoint: `${apiUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
      channelAuthorization: {
        endpoint: `${apiUrl}/broadcasting/auth`,
        transport: "ajax",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    });

    pusherRef.current = pusher;

    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    const handleEvent = (rawData) => {
      const normalized = normalizeEvent(rawData);
      if (!normalized) return;
      onEventRef.current?.(normalized);
    };

    channel.bind("RealtimeNotification", handleEvent);
    channel.bind(".RealtimeNotification", handleEvent);

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind("RealtimeNotification", handleEvent);
        channelRef.current.unbind(".RealtimeNotification", handleEvent);
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }

      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [authState?.data?.id, authState?.token, isLoggedIn]);
}
