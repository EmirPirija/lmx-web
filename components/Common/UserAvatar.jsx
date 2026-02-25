"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { User } from "@/components/Common/UnifiedIconPack";
import { settingsData } from "@/redux/reducer/settingSlice";
import { cn } from "@/lib/utils";
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
  onError,
  loading = "lazy",
  ...props
}) => {
  const settings = useSelector(settingsData);
  const placeholderImage = settings?.placeholder_image || "";
  const sourceList = useMemo(() => normalizeSources(src, sources), [src, sources]);
  const resolvedSrc = useMemo(
    () => resolveAvatarUrl(sourceList, { placeholderImage }),
    [sourceList, placeholderImage]
  );

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [resolvedSrc]);

  const shouldShowImage = Boolean(resolvedSrc) && !imgError;
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-100 dark:bg-slate-800",
        roundedClassName,
        className
      )}
      style={style}
      {...props}
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
        <div className={cn("h-full w-full flex items-center justify-center", fallbackClassName)}>
          <Icon className={iconClassName} />
        </div>
      )}
    </div>
  );
};

export default UserAvatar;

