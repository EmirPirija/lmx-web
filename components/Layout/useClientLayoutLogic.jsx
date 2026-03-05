import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { settingsApi } from "@/utils/api";
import {
  settingsSucess,
  getIsMaintenanceMode,
  settingsData,
} from "@/redux/reducer/settingSlice";
import {
  getKilometerRange,
  setKilometerRange,
  setIsBrowserSupported,
} from "@/redux/reducer/locationSlice";
import { getIsVisitedLandingPage } from "@/redux/reducer/globalStateSlice";
import { getCurrentLangCode, getIsRtl } from "@/redux/reducer/languageSlice";
import {
  getHasFetchedSystemSettings,
  setHasFetchedSystemSettings,
} from "@/utils/getFetcherStatus";
import { useNavigate } from "../Common/useNavigate";
import useGetCategories from "./useGetCategories";

export function useClientLayoutLogic() {
  const dispatch = useDispatch();
  const { navigate } = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const currentLangCode = useSelector(getCurrentLangCode);
  const isMaintenanceMode = useSelector(getIsMaintenanceMode);
  const settings = useSelector(settingsData);
  const isRtl = useSelector(getIsRtl);
  const appliedRange = useSelector(getKilometerRange);
  const isVisitedLandingPage = useSelector(getIsVisitedLandingPage);
  const [isRedirectToLanding, setIsRedirectToLanding] = useState(false);
  const { getCategories } = useGetCategories();

  const applySystemSettings = useCallback((settingsData) => {
    if (!settingsData) return;

    const min = Number(settingsData?.min_length);
    const max = Number(settingsData?.max_length);
    if (Number.isFinite(min) && Number.isFinite(max)) {
      if (appliedRange < min) dispatch(setKilometerRange(min));
      else if (appliedRange > max) dispatch(setKilometerRange(max));
    }

    if (settingsData?.web_theme_color) {
      document.documentElement.style.setProperty(
        "--primary",
        settingsData.web_theme_color,
      );
    }

    if (settingsData?.favicon_icon) {
      const favicon =
        document.querySelector('link[rel="icon"]') ||
        document.createElement("link");
      favicon.rel = "icon";
      favicon.href = settingsData.favicon_icon;
      if (!document.querySelector('link[rel="icon"]')) {
        document.head.appendChild(favicon);
      }
    }

    const showLandingPage = Number(settingsData?.show_landing_page) === 1;
    const isAlreadyOnLanding = window.location.pathname === "/landing";
    if (showLandingPage && !isVisitedLandingPage && !isAlreadyOnLanding) {
      setIsRedirectToLanding(true);
      navigate("/landing");
      return;
    }
    setIsRedirectToLanding(false);
  }, [appliedRange, dispatch, isVisitedLandingPage, navigate]);

  useEffect(() => {
    const getSystemSettings = async () => {
      if (settings && typeof settings === "object" && Object.keys(settings).length > 0) {
        applySystemSettings(settings);
        setHasFetchedSystemSettings(true);
        setIsLoading(false);
        return;
      }

      if (getHasFetchedSystemSettings()) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await settingsApi.getSettings();
        const data = response?.data;
        dispatch(settingsSucess({ data }));
        applySystemSettings(data?.data);
        setHasFetchedSystemSettings(true);
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getSystemSettings();

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) dispatch(setIsBrowserSupported(false));
  }, [currentLangCode, settings, dispatch, applySystemSettings]);

  // Set direction of the document
  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [isRtl]);

  useEffect(() => {
    getCategories(1);
  }, [currentLangCode, getCategories]);

  useEffect(() => {
    let mounted = true;

    const refreshSettingsInBackground = async () => {
      try {
        const response = await settingsApi.getSettings();
        const data = response?.data;
        if (!mounted || !data?.data) return;
        dispatch(settingsSucess({ data }));
        applySystemSettings(data.data);
        setHasFetchedSystemSettings(true);
      } catch {
        // Silent: background refresh must not impact active user flow.
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden) refreshSettingsInBackground();
    };

    const intervalId = window.setInterval(refreshSettingsInBackground, 120000);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentLangCode, dispatch, applySystemSettings]);

  return {
    isLoading,
    isMaintenanceMode,
    isRedirectToLanding,
  };
}
