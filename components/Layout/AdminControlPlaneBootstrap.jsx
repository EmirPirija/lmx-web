"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { settingsSucess } from "@/redux/reducer/settingSlice";
import { setHasFetchedSystemSettings } from "@/utils/getFetcherStatus";

const applyThemeAndFavicon = (settingsData = {}) => {
  if (typeof document === "undefined") return;

  if (settingsData?.web_theme_color) {
    document.documentElement.style.setProperty(
      "--primary",
      settingsData.web_theme_color,
    );
  }

  const faviconUrl = settingsData?.favicon_icon;
  if (!faviconUrl) return;

  const favicon =
    document.querySelector('link[rel="icon"]') || document.createElement("link");
  favicon.rel = "icon";
  favicon.href = faviconUrl;

  if (!document.querySelector('link[rel="icon"]')) {
    document.head.appendChild(favicon);
  }
};

export default function AdminControlPlaneBootstrap({
  settingsPayload = null,
  controlPlane = null,
}) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!settingsPayload?.data) return;
    dispatch(settingsSucess({ data: settingsPayload }));
    applyThemeAndFavicon(settingsPayload.data);
    setHasFetchedSystemSettings(true);
  }, [dispatch, settingsPayload]);

  useEffect(() => {
    if (typeof window === "undefined" || !controlPlane) return;
    window.__LMX_ADMIN_CONTROL_PLANE__ = controlPlane;
    window.dispatchEvent(
      new CustomEvent("lmx:admin-control-plane-updated", {
        detail: controlPlane,
      }),
    );
  }, [controlPlane]);

  return null;
}

