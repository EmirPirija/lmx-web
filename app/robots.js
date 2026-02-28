const normalizeUrl = (value) => {
  if (!value || typeof value !== "string") return "https://lmx.ba";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export default function robots() {
  const siteUrl = normalizeUrl(process.env.NEXT_PUBLIC_WEB_URL);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/profile/",
          "/messages/",
          "/chat/",
          "/my-ads/",
          "/settings/",
          "/admin/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
