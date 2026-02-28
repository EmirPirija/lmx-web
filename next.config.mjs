/** @type {import('next').NextConfig} */
const shouldDisableImageOptimization =
  process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === "1" ||
  process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === "true";

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
  // ADD THIS SECTION BELOW
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://admin.lmx.ba/api/:path*",
      },
    ];
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https:",
      "media-src 'self' blob: data: https:",
      "form-action 'self' https://admin.lmx.ba",
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
