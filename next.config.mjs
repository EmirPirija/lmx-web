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
};

export default nextConfig;
