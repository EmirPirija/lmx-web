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

    case "lmx-09": // Compass
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#E0F2F1" rx="12" />
          <circle cx="32" cy="32" r="18" fill="#009688" opacity="0.2" />
          <circle cx="32" cy="32" r="14" fill="none" stroke="#009688" strokeWidth="3" />
          <path d="M25 39 L39 25 L35 35 Z" fill="#00796B" />
          <circle cx="32" cy="32" r="2.5" fill="#004D40" />
        </svg>
      );

    case "lmx-10": // Pulse
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#E8EAF6" rx="12" />
          <path
            d="M10 36 H20 L24 24 L30 44 L36 20 L42 36 H54"
            fill="none"
            stroke="#3F51B5"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="32" r="18" fill="none" stroke="#7986CB" strokeWidth="1.5" opacity="0.5" />
        </svg>
      );

    case "lmx-11": // Shield
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#F1F8E9" rx="12" />
          <path d="M32 10 L48 16 V30 C48 42 41 50 32 54 C23 50 16 42 16 30 V16 Z" fill="#689F38" />
          <path d="M24 31 L30 37 L40 25" fill="none" stroke="#DCEDC8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case "lmx-12": // Crown
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#FFF8E1" rx="12" />
          <path d="M12 42 L18 18 L32 30 L46 18 L52 42 Z" fill="#FBC02D" />
          <rect x="12" y="42" width="40" height="8" rx="2" fill="#F9A825" />
          <circle cx="18" cy="18" r="3" fill="#FFE082" />
          <circle cx="32" cy="30" r="3" fill="#FFE082" />
          <circle cx="46" cy="18" r="3" fill="#FFE082" />
        </svg>
      );

    case "lmx-13": // Wave
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <defs>
            <linearGradient id="w13" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00ACC1" />
              <stop offset="100%" stopColor="#006064" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill="#E0F7FA" rx="12" />
          <path d="M8 38 C14 30, 22 46, 30 38 C38 30, 46 46, 56 36" stroke="url(#w13)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M8 28 C14 20, 22 36, 30 28 C38 20, 46 36, 56 26" stroke="#4DD0E1" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );

    case "lmx-14": // Spark
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#FBE9E7" rx="12" />
          <path d="M32 10 L37 24 L52 24 L40 33 L45 48 L32 39 L19 48 L24 33 L12 24 L27 24 Z" fill="#FF7043" />
          <circle cx="49" cy="14" r="3" fill="#FFCCBC" />
          <circle cx="14" cy="49" r="2.5" fill="#FFCCBC" />
        </svg>
      );

    case "lmx-15": // Pixel
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#ECEFF1" rx="12" />
          <rect x="18" y="18" width="8" height="8" fill="#455A64" />
          <rect x="28" y="18" width="8" height="8" fill="#607D8B" />
          <rect x="38" y="18" width="8" height="8" fill="#455A64" />
          <rect x="18" y="28" width="8" height="8" fill="#607D8B" />
          <rect x="28" y="28" width="8" height="8" fill="#263238" />
          <rect x="38" y="28" width="8" height="8" fill="#607D8B" />
          <rect x="18" y="38" width="8" height="8" fill="#455A64" />
          <rect x="28" y="38" width="8" height="8" fill="#607D8B" />
          <rect x="38" y="38" width="8" height="8" fill="#455A64" />
        </svg>
      );

    case "lmx-16": // Orbit
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <rect width="64" height="64" fill="#EDE7F6" rx="12" />
          <circle cx="32" cy="32" r="6" fill="#7E57C2" />
          <ellipse cx="32" cy="32" rx="20" ry="9" fill="none" stroke="#9575CD" strokeWidth="2.5" />
          <ellipse cx="32" cy="32" rx="9" ry="20" fill="none" stroke="#B39DDB" strokeWidth="2" />
          <circle cx="50" cy="32" r="3" fill="#5E35B1" />
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
