"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  MessageCircle,
  Phone,
} from "@/components/Common/UnifiedIconPack";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  CONTACT_REASON_CODES,
  resolveContactReasonMeta,
} from "@/lib/seller-settings-engine";
import { PHONE_CONTACT_STATES } from "@/lib/seller-contact";

const badgeToneClass = {
  neutral:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-300",
  info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-900/20 dark:text-sky-300",
};

const useCanHover = () => {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setCanHover(Boolean(media.matches));
    apply();
    media.addEventListener?.("change", apply);
    return () => media.removeEventListener?.("change", apply);
  }, []);

  return canHover;
};

const StatusBadge = ({
  label,
  title,
  tone = "neutral",
  icon: Icon = Info,
  lines = [],
}) => {
  const canHover = useCanHover();
  const [open, setOpen] = useState(false);

  const handleMouseEnter = () => {
    if (canHover) setOpen(true);
  };
  const handleMouseLeave = () => {
    if (canHover) setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => {
              if (!canHover) setOpen((prev) => !prev);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
              badgeToneClass[tone] || badgeToneClass.neutral,
            )}
          >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="z-[130] w-[250px] rounded-xl border border-slate-200 bg-white p-3 text-slate-800 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <p className="text-xs font-semibold">{title}</p>
        <div className="mt-2 space-y-1.5">
          {lines.map((line) => (
            <div
              key={line.label}
              className="flex items-start justify-between gap-3 text-[11px]"
            >
              <span className="text-slate-500 dark:text-slate-400">
                {line.label}
              </span>
              <span className="text-right font-medium">{line.value}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ContactTrustBadges = ({
  hasPhone = false,
  phoneState = "",
  phoneVerified = null,
  hasEmail = false,
  emailVerified = null,
  responseLabel = "",
  seenInfoLabel = "",
  phoneVisibleOnlyToLoggedIn = false,
  messagesOnly = false,
  quietHoursEnabled = false,
  quietHoursStart = "22:00",
  quietHoursEnd = "08:00",
  quietHoursActive = false,
  quietHoursMessage = "",
  reasonCodes = [],
  className = "",
}) => {
  const primaryBadges = useMemo(() => {
    const items = [];

    if (phoneState === PHONE_CONTACT_STATES.MESSAGES_ONLY) {
      items.push({
        code: "phone",
        label: "Samo poruke",
        tone: "info",
        Icon: MessageCircle,
        title: "Telefon",
        lines: [
          {
            label: "Telefon",
            value: "Prodavac prima samo poruke.",
          },
        ],
      });
    } else if (phoneState === PHONE_CONTACT_STATES.HIDDEN) {
      items.push({
        code: "phone",
        label: "Broj skriven",
        tone: "neutral",
        Icon: Phone,
        title: "Telefon",
        lines: [
          {
            label: "Telefon",
            value: "Korisnik je sakrio broj telefona.",
          },
        ],
      });
    } else if (phoneState === PHONE_CONTACT_STATES.LOGIN_REQUIRED) {
      items.push({
        code: "phone",
        label: "Broj uz prijavu",
        tone: "info",
        Icon: Phone,
        title: "Telefon",
        lines: [
          {
            label: "Telefon",
            value: "Broj telefona je vidljiv samo prijavljenim korisnicima.",
          },
        ],
      });
    } else if (phoneState === PHONE_CONTACT_STATES.MISSING || !hasPhone) {
      items.push({
        code: "phone",
        label: "Broj nedostaje",
        tone: "neutral",
        Icon: Phone,
        title: "Telefon",
        lines: [
          { label: "Telefon", value: "Korisnik nema dodan broj telefona." },
        ],
      });
    } else if (phoneVerified === true) {
      items.push({
        code: "phone",
        label: "Broj verifikovan",
        tone: "success",
        Icon: CheckCircle2,
        title: "Telefon",
        lines: [{ label: "Telefon", value: "Verifikovan" }],
      });
    } else {
      items.push({
        code: "phone",
        label: "Broj nije verifikovan",
        tone: "warning",
        Icon: AlertCircle,
        title: "Telefon",
        lines: [{ label: "Telefon", value: "Nije verifikovan" }],
      });
    }

    if (!hasEmail) {
      items.push({
        code: "email",
        label: "Email nedostaje",
        tone: "neutral",
        Icon: Info,
        title: "Email",
        lines: [{ label: "Email", value: "Korisnik nema dodan email." }],
      });
    } else if (emailVerified === true) {
      items.push({
        code: "email",
        label: "Email verifikovan",
        tone: "success",
        Icon: CheckCircle2,
        title: "Email",
        lines: [{ label: "Email", value: "Verifikovan" }],
      });
    } else {
      items.push({
        code: "email",
        label: "Email nije verifikovan",
        tone: "warning",
        Icon: AlertCircle,
        title: "Email",
        lines: [{ label: "Email", value: "Nije verifikovan" }],
      });
    }

    if (responseLabel) {
      items.push({
        code: "response-time",
        label: "Vrijeme odgovora",
        tone: "info",
        Icon: Clock,
        title: "Vrijeme odgovora",
        lines: [{ label: "Prosjek", value: responseLabel }],
      });
    }

    if (seenInfoLabel) {
      items.push({
        code: "last-seen",
        label: "Zadnja aktivnost",
        tone: "neutral",
        Icon: Clock,
        title: "Aktivnost",
        lines: [{ label: "Status", value: seenInfoLabel }],
      });
    }

    return items;
  }, [
    emailVerified,
    hasEmail,
    hasPhone,
    phoneState,
    phoneVerified,
    responseLabel,
    seenInfoLabel,
  ]);

  const normalizedReasonCodes = useMemo(() => {
    const incoming = Array.isArray(reasonCodes)
      ? reasonCodes.filter(Boolean)
      : [];

    const fallback = [];
    if (phoneVisibleOnlyToLoggedIn) {
      fallback.push(CONTACT_REASON_CODES.PHONE_VISIBLE_FOR_LOGGED_ONLY);
    }
    if (messagesOnly) {
      fallback.push(CONTACT_REASON_CODES.MESSAGES_ONLY);
    }
    if (quietHoursEnabled) {
      fallback.push(
        quietHoursActive
          ? CONTACT_REASON_CODES.QUIET_HOURS_ACTIVE
          : CONTACT_REASON_CODES.QUIET_HOURS_ENABLED,
      );
    }

    const merged = Array.from(
      new Set([...(incoming.length ? incoming : fallback)]),
    );
    if (
      merged.includes(CONTACT_REASON_CODES.QUIET_HOURS_ACTIVE) &&
      merged.includes(CONTACT_REASON_CODES.QUIET_HOURS_ENABLED)
    ) {
      return merged.filter(
        (code) => code !== CONTACT_REASON_CODES.QUIET_HOURS_ENABLED,
      );
    }
    return merged;
  }, [
    messagesOnly,
    phoneVisibleOnlyToLoggedIn,
    quietHoursActive,
    quietHoursEnabled,
    reasonCodes,
  ]);

  const reasonBadges = useMemo(() => {
    const iconByKey = {
      phone: Phone,
      message: MessageCircle,
      clock: Clock,
    };

    return normalizedReasonCodes
      .filter((reasonCode) => {
        if (
          reasonCode === CONTACT_REASON_CODES.PHONE_HIDDEN ||
          reasonCode === CONTACT_REASON_CODES.PHONE_MISSING ||
          reasonCode === CONTACT_REASON_CODES.PHONE_UNVERIFIED ||
          reasonCode === CONTACT_REASON_CODES.PHONE_LOGIN_REQUIRED
        ) {
          return false;
        }

        if (
          reasonCode === CONTACT_REASON_CODES.MESSAGES_ONLY &&
          phoneState === PHONE_CONTACT_STATES.MESSAGES_ONLY
        ) {
          return false;
        }

        if (
          reasonCode === CONTACT_REASON_CODES.PHONE_VISIBLE_FOR_LOGGED_ONLY &&
          phoneState === PHONE_CONTACT_STATES.LOGIN_REQUIRED
        ) {
          return false;
        }

        return true;
      })
      .map((reasonCode) => {
        const meta = resolveContactReasonMeta(reasonCode);
        if (!meta) return null;

        const Icon = iconByKey[meta.icon] || Info;
        const lines = [{ label: meta.title, value: meta.message }];

        if (
          reasonCode === CONTACT_REASON_CODES.QUIET_HOURS_ENABLED ||
          reasonCode === CONTACT_REASON_CODES.QUIET_HOURS_ACTIVE
        ) {
          lines.push({
            label: "Raspored",
            value: `${quietHoursStart} - ${quietHoursEnd}`,
          });
          lines.push({
            label: "Trenutno",
            value:
              reasonCode === CONTACT_REASON_CODES.QUIET_HOURS_ACTIVE
                ? "Aktivno"
                : "Neaktivno",
          });
          if (quietHoursMessage) {
            lines.push({ label: "Auto poruka", value: quietHoursMessage });
          }
        }

        return {
          code: reasonCode,
          label: meta.label,
          tone: meta.tone || "neutral",
          Icon,
          title: meta.title || "Kontakt",
          lines,
        };
      })
      .filter(Boolean);
  }, [
    normalizedReasonCodes,
    phoneState,
    quietHoursEnd,
    quietHoursMessage,
    quietHoursStart,
  ]);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {primaryBadges.map((badge) => (
        <StatusBadge
          key={badge.code}
          label={badge.label}
          tone={badge.tone}
          icon={badge.Icon}
          title={badge.title}
          lines={badge.lines}
        />
      ))}

      {reasonBadges.map((badge) => (
        <StatusBadge
          key={badge.code}
          label={badge.label}
          tone={badge.tone}
          icon={badge.Icon}
          title={badge.title}
          lines={badge.lines}
        />
      ))}
    </div>
  );
};

export default ContactTrustBadges;
