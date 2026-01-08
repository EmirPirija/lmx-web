/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  htmlLimitedBots: /.*/,
  images: {
    unoptimized: true,
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
    ],
  },
  // ADD THIS SECTION BELOW
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://admin.lmx.ba/api/:path*',
      },
    ];
  },
};

export default nextConfig;