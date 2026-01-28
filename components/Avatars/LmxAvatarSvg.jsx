import React from "react";

export default function LmxAvatarSvg({ avatarId = "lmx-01", className = "" }) {
  switch (avatarId) {
    case "lmx-02": // Rocket (Narandžasta)
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#FFF3E0" rx="12" />
          <path
            d="M32 10 C32 10 18 30 18 42 C18 48 22 54 32 54 C42 54 46 48 46 42 C46 30 32 10 32 10 Z"
            fill="#FF9800"
          />
          <circle cx="32" cy="38" r="5" fill="#FFE0B2" />
          <path d="M18 42 L12 54 L24 54" fill="#F57C00" />
          <path d="M46 42 L52 54 L40 54" fill="#F57C00" />
        </svg>
      );

    case "lmx-03": // Tag (Zelena)
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#E8F5E9" rx="12" />
          <path
            d="M20 14 L44 14 L44 36 L32 50 L20 36 Z"
            fill="#4CAF50"
            transform="rotate(-45 32 32)"
          />
          <circle cx="26" cy="20" r="3" fill="#C8E6C9" transform="rotate(-45 32 32)" />
        </svg>
      );

    case "lmx-04": // Diamond (Ljubičasta)
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#F3E5F5" rx="12" />
          <path d="M14 24 L20 14 L44 14 L50 24 L32 50 Z" fill="#9C27B0" />
          <path d="M14 24 L50 24" stroke="#E1BEE7" strokeWidth="1" />
          <path d="M20 14 L32 50 L44 14" fill="none" stroke="#E1BEE7" strokeWidth="1" opacity="0.5" />
        </svg>
      );

    case "lmx-05": // Bolt (Žuta)
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#FFFDE7" rx="12" />
          <path
            d="M36 8 L18 34 L30 34 L24 56 L48 24 L36 24 Z"
            fill="#FFEB3B"
            stroke="#FBC02D"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "lmx-06": // Heart (Roza)
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#FFEBEE" rx="12" />
          <path
            d="M32 54 C32 54 54 38 54 26 C54 16 42 12 32 22 C22 12 10 16 10 26 C10 38 32 54 32 54 Z"
            fill="#E91E63"
          />
          <path d="M40 18 A 3 3 0 0 1 44 18" fill="none" stroke="#F8BBD0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "lmx-07": // Star (Plava/Cyan)
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#E0F7FA" rx="12" />
          <path
            d="M32 10 L38 24 L54 24 L42 34 L46 50 L32 40 L18 50 L22 34 L10 24 L26 24 Z"
            fill="#00BCD4"
          />
          <circle cx="32" cy="32" r="4" fill="#B2EBF2" opacity="0.6" />
        </svg>
      );

    case "lmx-08": // Box (Smeđa)
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#EFEBE9" rx="12" />
          <rect x="16" y="24" width="32" height="28" rx="2" fill="#795548" />
          <path d="M12 16 L52 16 L52 24 L12 24 Z" fill="#8D6E63" />
          <rect x="28" y="30" width="8" height="10" rx="1" fill="#D7CCC8" opacity="0.5" />
        </svg>
      );

    case "lmx-01":
    default: // Shop (Plava - Default)
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#E3F2FD" rx="12" />
          <path d="M14 26 L50 26 L44 54 L20 54 Z" fill="#2196F3" />
          <path
            d="M20 26 C20 12 44 12 44 26"
            fill="none"
            stroke="#2196F3"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="32" cy="40" r="3" fill="#BBDEFB" />
        </svg>
      );
  }
}