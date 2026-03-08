"use client";

import { getPlaceholderImage } from "@/redux/reducer/settingSlice";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { normalizeLegacyImageUrl } from "@/utils/categoryImage";

const DEFAULT_OPTIMIZED_REMOTE_HOSTS = [
  "admin.lmx.ba",
  "eclassify.thewrteam.in",
  "lh3.googleusercontent.com",
  "img.youtube.com",
  "i.ytimg.com",
];

const ENV_OPTIMIZED_REMOTE_HOSTS = String(
  process.env.NEXT_PUBLIC_IMAGE_OPTIMIZED_HOSTS || "",
)
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

const OPTIMIZED_REMOTE_HOSTS = Array.from(
  new Set([...DEFAULT_OPTIMIZED_REMOTE_HOSTS, ...ENV_OPTIMIZED_REMOTE_HOSTS]),
);

const shouldOptimizeRemoteSource = (value) => {
  try {
    const hostname = new URL(String(value || "")).hostname.toLowerCase();
    if (!hostname) return false;
    return OPTIMIZED_REMOTE_HOSTS.some(
      (allowedHost) =>
        hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
    );
  } catch {
    return false;
  }
};

const CustomImage = ({
  src,
  alt,
  loading = "lazy",
  sizes,
  decoding = "async",
  unoptimized,
  ...props
}) => {
  const placeholderImage = useSelector(getPlaceholderImage);
  const fallback = "/assets/Transperant_Placeholder.png";

  const normalizedPlaceholder = useMemo(() => {
    if (typeof placeholderImage !== "string") return "";
    return normalizeLegacyImageUrl(placeholderImage) || "";
  }, [placeholderImage]);

  const resolvedSrc = useMemo(() => {
    const normalizedSrc =
      typeof src === "string" ? normalizeLegacyImageUrl(src) : src;

    return normalizedSrc || normalizedPlaceholder || fallback;
  }, [src, normalizedPlaceholder]);

  const [imgSrc, setImgSrc] = useState(resolvedSrc);

  useEffect(() => {
    setImgSrc(resolvedSrc);
  }, [resolvedSrc]);

  const shouldBypassOptimization = useMemo(() => {
    const rawSrc = String(imgSrc || "").trim();
    if (!/^https?:\/\//i.test(rawSrc)) return false;
    return !shouldOptimizeRemoteSource(rawSrc);
  }, [imgSrc]);

  const handleError = () => {
    if (imgSrc !== normalizedPlaceholder && normalizedPlaceholder) {
      setImgSrc(normalizedPlaceholder);
    } else if (imgSrc !== fallback) {
      setImgSrc(fallback);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={handleError}
      loading={loading}
      decoding={decoding}
      sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"}
      unoptimized={typeof unoptimized === "boolean" ? unoptimized : shouldBypassOptimization}
      {...props}
    />
  );
};

export default CustomImage;
