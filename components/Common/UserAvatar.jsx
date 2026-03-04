"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { MdVerified, User } from "@/components/Common/UnifiedIconPack";
import { settingsData } from "@/redux/reducer/settingSlice";
import { cn } from "@/lib/utils";
import { resolvePhoneVerificationFromSources } from "@/lib/seller-contact";
import { isSellerVerified } from "@/lib/seller-verification";
import { resolveAvatarUrl } from "@/utils/avatar";

const normalizeSources = (src, sources) => {
  if (Array.isArray(sources)) return src ? [src, ...sources] : sources;
  if (sources) return src ? [src, sources] : [sources];
  return src ? [src] : [];
};

const UserAvatar = ({
  src,
  sources,
  alt = "Korisnik",
  size = null,
  className = "",
  imageClassName = "",
  roundedClassName = "rounded-full",
  fallbackClassName = "bg-white text-primary dark:bg-slate-900",
  iconClassName = "h-[52%] w-[52%] text-primary/70",
  icon: Icon = User,
  verificationSource = null,
  verificationSources = [],
  verified = null,
  showVerifiedBadge = false,
  verifiedSource = null,
  verifiedSources = [],
  verifiedBadgeClassName = "",
  phoneVerified = null,
  showPhoneVerifiedBadge = true,
  phoneVerifiedBadgeClassName = "",
  onError,
  loading = "lazy",
  ...props
}) => {
  const settings = useSelector(settingsData);
  const placeholderImage = settings?.placeholder_image || "";
  const sourceList = useMemo(
    () => normalizeSources(src, sources),
    [src, sources],
  );
  const resolvedSrc = useMemo(
    () => resolveAvatarUrl(sourceList, { placeholderImage }),
    [sourceList, placeholderImage],
  );

  const [imgError, setImgError] = useState(false);

  const resolvedPhoneVerified = useMemo(() => {
    if (typeof phoneVerified === "boolean") return phoneVerified;
    return resolvePhoneVerificationFromSources(
      verificationSource,
      verificationSources,
    );
  }, [phoneVerified, verificationSource, verificationSources]);

  const resolvedVerified = useMemo(() => {
    if (!showVerifiedBadge) return false;
    if (typeof verified === "boolean") return verified;

    const explicitSources = normalizeSources(verifiedSource, verifiedSources);
    if (explicitSources.length > 0) {
      return isSellerVerified(...explicitSources);
    }

    const fallbackSources = normalizeSources(
      verificationSource,
      verificationSources,
    );
    return isSellerVerified(...fallbackSources);
  }, [
    showVerifiedBadge,
    verified,
    verifiedSource,
    verifiedSources,
    verificationSource,
    verificationSources,
  ]);

  useEffect(() => {
    setImgError(false);
  }, [resolvedSrc]);

  const shouldShowImage = Boolean(resolvedSrc) && !imgError;
  const style = size ? { width: size, height: size } : undefined;
  const numericSize = Number(size);
  const badgeSize =
    Number.isFinite(numericSize) && numericSize > 0
      ? Math.max(14, Math.round(numericSize * 0.33))
      : 14;
  const verifiedBadgeSize =
    Number.isFinite(numericSize) && numericSize > 0
      ? Math.max(14, Math.round(numericSize * 0.36))
      : 14;
  const shouldRenderPhoneVerifiedBadge =
    showPhoneVerifiedBadge && resolvedPhoneVerified === true && !resolvedVerified;

  return (
    <div
      className={cn("relative", roundedClassName, className)}
      style={style}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-800",
          roundedClassName,
        )}
      >
        {shouldShowImage ? (
          <img
            src={resolvedSrc}
            alt={alt}
            className={cn("h-full w-full object-cover", imageClassName)}
            loading={loading}
            onError={(event) => {
              setImgError(true);
              onError?.(event);
            }}
          />
        ) : (
          <div
            className={cn(
              "h-full w-full flex items-center justify-center",
              fallbackClassName,
              roundedClassName,
            )}
          >
            <Icon className={iconClassName} />
          </div>
        )}
      </div>

      {resolvedVerified ? (
        <span
          className={cn(
            "absolute right-0 top-0 z-30 flex items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm dark:border-slate-900",
            verifiedBadgeClassName,
          )}
          style={{
            width: verifiedBadgeSize,
            height: verifiedBadgeSize,
          }}
        >
          <MdVerified className="text-white" size={10} />
        </span>
      ) : null}

      {shouldRenderPhoneVerifiedBadge ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 z-20 flex items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-sm dark:border-slate-900",
            phoneVerifiedBadgeClassName,
          )}
          style={{
            width: badgeSize,
            height: badgeSize,
          }}
        >
          <MdVerified className="text-white" size={10} />
        </span>
      ) : null}
    </div>
  );
};

export default UserAvatar;
