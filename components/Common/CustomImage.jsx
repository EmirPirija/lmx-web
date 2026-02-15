"use client";

import { getPlaceholderImage } from "@/redux/reducer/settingSlice";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { normalizeLegacyImageUrl } from "@/utils/categoryImage";

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

  const shouldBypassOptimization = useMemo(
    () => /^https?:\/\//i.test(String(imgSrc || "")),
    [imgSrc]
  );

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
