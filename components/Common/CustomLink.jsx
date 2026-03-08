"use client";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import { getDefaultLanguageCode } from "@/redux/reducer/settingSlice";
import Link from "next/link";
import { useSelector } from "react-redux";

const shouldDisableAutoPrefetch = (href = "") => {
  const normalized = String(href || "").trim().toLowerCase();
  if (!normalized.startsWith("/")) return false;
  return (
    normalized.startsWith("/ad-details/") ||
    normalized.startsWith("/my-listing/") ||
    normalized.startsWith("/my-ads/")
  );
};

const CustomLink = ({ href, children, prefetch, ...props }) => {
  const defaultLangCode = useSelector(getDefaultLanguageCode);
  const currentLangCode = useSelector(getCurrentLangCode);

  const langCode = currentLangCode || defaultLangCode;

  if (typeof href !== "string") {
    return (
      <Link href={href} prefetch={prefetch} {...props}>
        {children}
      </Link>
    );
  }

  // Split hash (#) safely from href
  const [baseHref, hash = ""] = href.split("#");

  // Append lang param safely
  const separator = baseHref.includes("?") ? "&" : "?";
  const newHref = `${baseHref}${separator}lang=${langCode}${
    hash ? `#${hash}` : ""
  }`;
  const resolvedPrefetch =
    typeof prefetch === "boolean"
      ? prefetch
      : shouldDisableAutoPrefetch(baseHref)
        ? false
        : undefined;

  return (
    <Link href={newHref} prefetch={resolvedPrefetch} {...props}>
      {children}
    </Link>
  );
};

export default CustomLink;
