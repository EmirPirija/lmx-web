export default function LmxAvatarSvg({ avatarId = "lmx-01", className = "" }) {
  switch (avatarId) {
    case "lmx-02":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.08" />
          <path
            d="M42 44c-10 0-18-8-18-18 0-5.5 2.4-10.4 6.2-13.7C20.8 14.3 14 22.2 14 32c0 13.3 10.7 24 24 24 9.8 0 18.3-6 22-14.6-3.2 2.1-7 3.6-10 3.6Z"
            fill="currentColor"
            opacity="0.9"
          />
          <circle cx="40" cy="24" r="2" fill="currentColor" />
          <circle cx="46" cy="30" r="1.5" fill="currentColor" opacity="0.9" />
        </svg>
      );

    case "lmx-03":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.08" />
          <path
            d="M12 36c7-10 14-10 21 0s14 10 19 0 8-10 12-6"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M10 44c8-8 16-8 24 0s16 8 20 0"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      );

    case "lmx-04":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.08" />
          <path
            d="M36 10 18 36h14l-4 18 18-26H32l4-18Z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
      );

    case "lmx-05":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.08" />
          <path
            d="M48 18c-10 0-18 6-22 16-3 7-2 14-2 14s7 1 14-2c10-4 16-12 16-22 0-2-.3-4-.9-6.1-1.6.7-3.3 1.1-5.1 1.1Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M26 48c8-8 14-14 20-22"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
        </svg>
      );

    case "lmx-06":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.08" />
          <path
            d="M32 12l5.5 12 13 1-10 8 3 13-11.5-6-11.5 6 3-13-10-8 13-1L32 12Z"
            fill="currentColor"
            opacity="0.95"
          />
        </svg>
      );

    case "lmx-07":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.08" />
          <path
            d="M20 26 32 18l12 8v14l-12 8-12-8V26Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.95"
          />
          <path
            d="M20 26l12 8 12-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.65"
          />
          <path
            d="M32 34v14"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            opacity="0.65"
          />
        </svg>
      );

    case "lmx-08":
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.08" />
          <circle
            cx="32"
            cy="32"
            r="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            opacity="0.95"
          />
          <path
            d="M10 32h44"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          <path
            d="M32 10v44"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      );

    case "lmx-01":
    default:
      return (
        <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
          <circle cx="32" cy="32" r="14" fill="currentColor" opacity="0.9" />
          <circle cx="32" cy="32" r="28" fill="currentColor" opacity="0.08" />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * Math.PI) / 4;
            const x1 = 32 + Math.cos(angle) * 20;
            const y1 = 32 + Math.sin(angle) * 20;
            const x2 = 32 + Math.cos(angle) * 26;
            const y2 = 32 + Math.sin(angle) * 26;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.75"
              />
            );
          })}
        </svg>
      );
  }
}

