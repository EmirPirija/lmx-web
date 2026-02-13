import { logoutSuccess } from "@/redux/reducer/authSlice";
import { setIsUnauthorized } from "@/redux/reducer/globalStateSlice";
import { store } from "@/redux/store";
import axios from "axios";

const Api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`,
});

let isUnauthorizedToastShown = false;
const UNAUTHORIZED_COOLDOWN_MS = 10000;
let lastUnauthorizedAt = 0;

Api.interceptors.request.use(function (config) {
  let token = undefined;
  let langCode = undefined;

  if (typeof window !== "undefined") {
    const state = store.getState();
    token = state?.UserSignup?.data?.token;
    langCode = state?.CurrentLanguage?.language?.code;
  }

  if (token) config.headers.authorization = `Bearer ${token}`;
  if (langCode) config.headers["Content-Language"] = langCode;

  return config;
});

// Add a response interceptor
Api.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const status = error?.response?.status;
    if (status === 401) {
      const state = store.getState();
      const hasTokenInStore = Boolean(state?.UserSignup?.data?.token);
      const hadAuthHeader = Boolean(
        error?.config?.headers?.authorization || error?.config?.headers?.Authorization
      );
      const requestUrl = String(error?.config?.url || "");
      const isLogoutRequest = requestUrl.includes("logout");

      // Avoid endless unauthorized popups for guests/public requests.
      // Only handle when there was an authenticated session/request.
      if (!isLogoutRequest && (hasTokenInStore || hadAuthHeader)) {
        logoutSuccess();

        const now = Date.now();
        const canShowModal = now - lastUnauthorizedAt >= UNAUTHORIZED_COOLDOWN_MS;
        if (!isUnauthorizedToastShown && canShowModal) {
          store.dispatch(setIsUnauthorized(true));
          isUnauthorizedToastShown = true;
          lastUnauthorizedAt = now;

          setTimeout(() => {
            isUnauthorizedToastShown = false;
          }, 3000);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default Api;
