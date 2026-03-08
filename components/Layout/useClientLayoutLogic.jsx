import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { runtimeApi, settingsApi } from "@/utils/api";
import {
  settingsSucess,
  getIsMaintenanceMode,
  settingsData,
} from "@/redux/reducer/settingSlice";
import {
  runtimeConfigData,
  runtimeConfigEtag,
  runtimeConfigFailed,
  runtimeConfigNotModified,
  runtimeConfigSuccess,
} from "@/redux/reducer/runtimeConfigSlice";
import {
  getKilometerRange,
  setKilometerRange,
  setIsBrowserSupported,
} from "@/redux/reducer/locationSlice";
import { getIsVisitedLandingPage } from "@/redux/reducer/globalStateSlice";
import { getCurrentLangCode, getIsRtl } from "@/redux/reducer/languageSlice";
import {
  getRuntimeConfigRefreshTtlMs,
  getSystemSettingsRefreshTtlMs,
  markRuntimeConfigFetched,
  markSystemSettingsFetched,
  shouldRefetchRuntimeConfig,
  shouldRefetchSystemSettings,
} from "@/utils/getFetcherStatus";
import { useNavigate } from "../Common/useNavigate";

export function useClientLayoutLogic() {
  const dispatch = useDispatch();
  const { navigate } = useNavigate();
  const persistedSettings = useSelector(settingsData);
  const persistedRuntimeConfig = useSelector(runtimeConfigData);
  const persistedRuntimeEtag = useSelector(runtimeConfigEtag);
  const hasPersistedSettings = Boolean(
    persistedSettings &&
      typeof persistedSettings === "object" &&
      Object.keys(persistedSettings).length > 0,
  );
  const hasPersistedRuntimeConfig = Boolean(
    persistedRuntimeConfig &&
      typeof persistedRuntimeConfig === "object" &&
      Object.keys(persistedRuntimeConfig).length > 0,
  );
  const [isLoading, setIsLoading] = useState(!hasPersistedSettings);
  const currentLangCode = useSelector(getCurrentLangCode);
  const isMaintenanceMode = useSelector(getIsMaintenanceMode);
  const isRtl = useSelector(getIsRtl);
  const appliedRange = useSelector(getKilometerRange);
  const isVisitedLandingPage = useSelector(getIsVisitedLandingPage);
  const [isRedirectToLanding, setIsRedirectToLanding] = useState(false);

  useEffect(() => {
    if (!hasPersistedSettings) return;
    setIsLoading(false);
  }, [hasPersistedSettings]);

  const applyUiBranding = useCallback((settingsPayload) => {
    if (typeof document === "undefined") return;
    const nextPrimary = settingsPayload?.web_theme_color;
    if (nextPrimary) {
      document.documentElement.style.setProperty("--primary", nextPrimary);
    }

    const faviconHref = settingsPayload?.favicon_icon;
    if (!faviconHref) return;
    const favicon =
      document.querySelector('link[rel="icon"]') ||
      document.createElement("link");
    favicon.rel = "icon";
    favicon.href = faviconHref;
    if (!document.querySelector('link[rel="icon"]')) {
      document.head.appendChild(favicon);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const getSystemSettings = async ({
      showLoader = false,
      force = false,
    } = {}) => {
      if (!force && !shouldRefetchSystemSettings()) {
        if (showLoader && isMounted) {
          setIsLoading(false);
        }
        return;
      }

      if (showLoader && isMounted) {
        setIsLoading(true);
      }

      try {
        // Get settings from API
        const response = await settingsApi.getSettings();
        const data = response?.data;

        if (!isMounted) return;

        dispatch(settingsSucess({ data }));

        // Set kilometer range from settings API
        const min = Number(data?.data?.min_length);
        const max = Number(data?.data?.max_length);
        if (appliedRange < min) dispatch(setKilometerRange(min));
        else if (appliedRange > max) dispatch(setKilometerRange(max));

        applyUiBranding(data?.data);

        markSystemSettingsFetched();

        // Check if landing page is enabled and redirect to landing page if not visited
        const showLandingPage = Number(data?.data?.show_landing_page) === 1;
        if (showLandingPage && !isVisitedLandingPage) {
          setIsRedirectToLanding(true);
          navigate("/landing");
          return;
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        if (showLoader && isMounted) {
          setIsLoading(false);
        }
      }
    };

    const getRuntimeConfig = async ({ force = false } = {}) => {
      if (!force && !shouldRefetchRuntimeConfig()) {
        return;
      }

      try {
        const response = await runtimeApi.getRuntimeConfig({
          etag: persistedRuntimeEtag,
        });

        if (!isMounted) return;

        if (response?.status === 304) {
          dispatch(
            runtimeConfigNotModified({
              fetchedAt: Date.now(),
              etag: persistedRuntimeEtag,
            }),
          );
          markRuntimeConfigFetched();
          return;
        }

        const runtimeData = response?.data?.data || null;
        const nextEtag =
          response?.headers?.etag ||
          response?.headers?.ETag ||
          persistedRuntimeEtag ||
          null;

        dispatch(
          runtimeConfigSuccess({
            data: runtimeData,
            etag: nextEtag,
            fetchedAt: Date.now(),
          }),
        );
        markRuntimeConfigFetched();
      } catch (error) {
        dispatch(
          runtimeConfigFailed({
            error: error?.message || "runtime_config_fetch_failed",
            fetchedAt: Date.now(),
          }),
        );
        console.error("Error fetching runtime config:", error);
      }
    };

    if (hasPersistedSettings) {
      applyUiBranding(persistedSettings);
      markSystemSettingsFetched();
    }
    if (hasPersistedRuntimeConfig) {
      markRuntimeConfigFetched();
    }

    getSystemSettings({ showLoader: !hasPersistedSettings });
    getRuntimeConfig({ force: !hasPersistedRuntimeConfig });

    const refreshIntervalMs = Math.max(
      Math.min(getSystemSettingsRefreshTtlMs(), getRuntimeConfigRefreshTtlMs()),
      30_000,
    );
    const refreshTimer = window.setInterval(() => {
      getSystemSettings();
      getRuntimeConfig();
    }, refreshIntervalMs);

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) dispatch(setIsBrowserSupported(false));

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [
    appliedRange,
    currentLangCode,
    dispatch,
    hasPersistedSettings,
    hasPersistedRuntimeConfig,
    isVisitedLandingPage,
    navigate,
    applyUiBranding,
    persistedSettings,
    persistedRuntimeEtag,
  ]);

  // Set direction of the document
  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [isRtl]);

  return {
    isLoading,
    isMaintenanceMode,
    isRedirectToLanding,
  };
}
