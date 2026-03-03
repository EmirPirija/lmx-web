importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js");

const parseFirebaseConfigFromQuery = () => {
  const url = new URL(self.location.href);
  const get = (key) => {
    const value = url.searchParams.get(key);
    return value ? value.trim() : "";
  };

  return {
    apiKey: get("apiKey"),
    authDomain: get("authDomain"),
    projectId: get("projectId"),
    storageBucket: get("storageBucket"),
    messagingSenderId: get("messagingSenderId"),
    appId: get("appId"),
    measurementId: get("measurementId"),
  };
};

const firebaseConfig = parseFirebaseConfigFromQuery();
const hasRequiredConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

if (hasRequiredConfig) {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title =
      payload?.notification?.title ||
      payload?.data?.title ||
      "Nova obavijest";
    const body =
      payload?.notification?.body ||
      payload?.data?.body ||
      "Imate novu aktivnost.";

    self.registration.showNotification(title, {
      body,
      data: payload?.data || {},
    });
  });
}
