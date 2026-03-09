"use client";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import { getDefaultLanguageCode } from "@/redux/reducer/settingSlice";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { localizeInternalPath } from "@/lib/routeSlugs";

export const useNavigate = () => {
  const router = useRouter();
  const pathname = usePathname();
  const currentLangCode = useSelector(getCurrentLangCode);
  const defaultLangCode = useSelector(getDefaultLanguageCode);

  const langCode = currentLangCode || defaultLangCode;

  const appendLangParam = (path) => {
    if (path.includes("?")) {
      const langParam = langCode ? `&lang=${langCode}` : "";
      return `${path}${langParam}`;
    }

    const langParam = langCode ? `?lang=${langCode}` : "";
    return `${path}${langParam}`;
  };

  const isSamePathnameNavigation = (targetPath) => {
    if (typeof window === "undefined") return false;
    try {
      const targetUrl = new URL(targetPath, window.location.href);
      return targetUrl.pathname === pathname;
    } catch {
      return false;
    }
  };

  const navigate = (path, options = {}) => {
    const localizedPath = localizeInternalPath(path);
    const targetPath = appendLangParam(localizedPath);
    const mergedOptions = { ...(options || {}) };

    if (
      mergedOptions.scroll === undefined &&
      isSamePathnameNavigation(targetPath)
    ) {
      mergedOptions.scroll = false;
    }

    router.push(targetPath, mergedOptions);
  };

  return { navigate };
};
