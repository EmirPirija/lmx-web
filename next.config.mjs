/** @type {import('next').NextConfig} */
const shouldDisableImageOptimization =
  process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === "1" ||
  process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === "true";
const isDev = process.env.NODE_ENV !== "production";

const slugRouteMappings = [
  { legacy: "/ad-listing", localized: "/objavi-oglas" },
  { legacy: "/ad-details", localized: "/oglas" },
  { legacy: "/about-us", localized: "/o-nama" },
  { legacy: "/contact-us", localized: "/kontakt" },
  { legacy: "/faqs", localized: "/cesta-pitanja" },
  { legacy: "/terms-and-condition", localized: "/uslovi-koristenja" },
  { legacy: "/privacy-policy", localized: "/politika-privatnosti" },
  { legacy: "/refund-policy", localized: "/politika-povrata" },
  { legacy: "/data-deletion", localized: "/brisanje-podataka" },
  { legacy: "/map-search", localized: "/pretraga-mapa" },
  { legacy: "/subscription", localized: "/pretplata" },
  { legacy: "/blogs", localized: "/blog" },
  { legacy: "/seller", localized: "/prodavac" },
  { legacy: "/shop", localized: "/prodavnica" },
  { legacy: "/ads", localized: "/oglasi" },
];

const routeRedirects = slugRouteMappings.map(({ legacy, localized }) => ({
  source: `${legacy}/:path*`,
  destination: `${localized}/:path*`,
  permanent: true,
}));

const routeRewrites = slugRouteMappings.map(({ legacy, localized }) => ({
  source: `${localized}/:path*`,
  destination: `${legacy}/:path*`,
}));

const nextConfig = {
  reactStrictMode: false,
  htmlLimitedBots: /.*/,
  images: {
    unoptimized: shouldDisableImageOptimization,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.lmx.ba", // Added your actual admin hostname
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "eclassify.thewrteam.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return routeRedirects;
  },
  // ADD THIS SECTION BELOW
  async rewrites() {
    return [
      ...routeRewrites,
      {
        // Keep local /api passthrough for legacy/dev calls, but never override
        // Next.js internal proxy handlers under /api/internal/*.
        source: "/api/:path((?!internal(?:/|$)).*)",
        destination: "https://admin.lmx.ba/api/:path*",
      },
    ];
  },
  async headers() {
    const scriptSrc = ["'self'", "'unsafe-inline'", "https:"];
    if (isDev) {
      scriptSrc.push("'unsafe-eval'");
    }

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      `script-src ${scriptSrc.join(" ")}`,
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "media-src 'self' blob: data: https:",
      "form-action 'self' https://admin.lmx.ba",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
