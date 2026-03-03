"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";
import firebase from "firebase/compat/app";
import { getAuth } from "firebase/auth";
import { toast } from "@/utils/toastBs";
import { createStickyNote } from ".";
import { getFcmToken } from "@/redux/reducer/settingSlice";

const isFirebaseDebugEnabled = process.env.NODE_ENV !== "production";
const firebaseDebugLog = (...args) => {
  if (isFirebaseDebugEnabled) {
    console.log(...args);
  }
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID,
};

const getFirebaseApp = () => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  if (getApps().length) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
};

const ensureServiceWorkerRegistration = async () => {
  const existing = await navigator.serviceWorker.getRegistration(
    "/firebase-messaging-sw.js",
  );
  if (existing) return existing;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  await navigator.serviceWorker.ready;
  firebaseDebugLog(
    "Service Worker registration successful with scope:",
    registration.scope,
  );
  return registration;
};

const FirebaseData = () => {
  const app = getFirebaseApp();
  const authentication = getAuth(app);

  const messagingInstance = async () => {
    try {
      const isSupportedBrowser = await isSupported();
      if (isSupportedBrowser) {
        return getMessaging(app);
      }
      createStickyNote();
      return null;
    } catch (err) {
      console.error("Error checking messaging support:", err);
      return null;
    }
  };

  const fetchToken = async (setFcmToken) => {
    try {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        typeof Notification === "undefined"
      ) {
        return null;
      }

      const messaging = await messagingInstance();
      if (!messaging) return null;

      const vapidKey = String(process.env.NEXT_PUBLIC_VAPID_KEY || "").trim();
      if (!vapidKey) {
        firebaseDebugLog("FCM skipped: NEXT_PUBLIC_VAPID_KEY is missing.");
        return null;
      }

      if (Notification.permission === "denied") {
        firebaseDebugLog("Notifications are blocked by the browser user.");
        return null;
      }

      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      if (permission !== "granted") {
        firebaseDebugLog("Notification permission not granted.");
        return null;
      }

      const serviceWorkerRegistration = await ensureServiceWorkerRegistration();
      const currentToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration,
      });

      if (!currentToken) {
        toast.error("Potrebna je dozvola za obavještenja.");
        return null;
      }

      getFcmToken(currentToken);
      if (typeof setFcmToken === "function") {
        setFcmToken(currentToken);
      }

      return currentToken;
    } catch (err) {
      const errorCode = String(err?.code || "");
      const errorMessage = String(err?.message || "");

      if (
        errorCode.includes("messaging/token-update-failed") ||
        errorMessage.includes("messaging/token-update-failed")
      ) {
        console.warn("FCM token update skipped:", errorMessage);
        return null;
      }

      console.error("Error retrieving token:", err);
      return null;
    }
  };

  const onMessageListener = async (callback) => {
    const messaging = await messagingInstance();
    if (messaging) {
      return onMessage(messaging, callback);
    }
    console.error("Messaging not supported.");
    return null;
  };

  const signOut = () => authentication.signOut();

  return { firebase, authentication, fetchToken, onMessageListener, signOut };
};

export default FirebaseData;
