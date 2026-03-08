import { cache } from "react";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";

const normalizeUrl = (value) => {
  if (!value || typeof value !== "string") return "https://lmx.ba";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const SITE_URL = normalizeUrl(process.env.NEXT_PUBLIC_WEB_URL);
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}`;

const boolFromValue = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const parseJsonSafe = (value) => {
  if (!value) return null;
  if (Array.isArray(value) || typeof value === "object") return value;
  try {
    const decoded = JSON.parse(value);
    return decoded && typeof decoded === "object" ? decoded : null;
  } catch {
    return null;
  }
};

const ensureAbsoluteUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${SITE_URL}${raw}`;
  return `${SITE_URL}/${raw}`;
};

const fetchJsonWithTimeout = async (
  url,
  { headers = {}, revalidate = SEO_REVALIDATE_SECONDS, timeoutMs = 2200 } = {},
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      next: { revalidate },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const extractSeoEntry = (payload) => {
  const list = Array.isArray(payload?.data) ? payload.data : [];
  return list[0] || null;
};

export const fetchSeoPage = cache(async (page, langCode = "en") => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return null;
  const url = `${API_BASE}seo-settings?page=${encodeURIComponent(
    page,
  )}&include_global=1`;
  const payload = await fetchJsonWithTimeout(url, {
    headers: {
      "Content-Language": langCode || "en",
    },
  });
  return extractSeoEntry(payload);
});

export const fetchGlobalSeo = cache(async (langCode = "en") => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return null;
  const url = `${API_BASE}seo-settings?page=global&include_global=0`;
  const payload = await fetchJsonWithTimeout(url, {
    headers: {
      "Content-Language": langCode || "en",
    },
  });
  return extractSeoEntry(payload);
});

export const fetchSystemSettingsSeo = cache(async () => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return null;
  const payload = await fetchJsonWithTimeout(`${API_BASE}get-system-settings`, {
    timeoutMs: 2500,
  });
  return payload?.data || null;
});

const pickSeoValue = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return null;
};

export const buildSeoMetadata = ({
  seo = null,
  fallbackTitle = process.env.NEXT_PUBLIC_META_TITLE || "LMX.ba",
  fallbackDescription =
    process.env.NEXT_PUBLIC_META_DESCRIPTION ||
    "LMX marketplace platforma za kupovinu i prodaju u BiH.",
  fallbackKeywords =
    process.env.NEXT_PUBLIC_META_KEYWORDS ||
    process.env.NEXT_PUBLIC_META_kEYWORDS ||
    "LMX, marketplace, kupovina, prodaja, oglasi",
  canonicalPath = "/",
  explicitCanonical = "",
  fallbackImage = "/apple-touch-icon.png",
}) => {
  const resolved = seo?.resolved || {};
  const title = pickSeoValue(
    resolved?.title,
    seo?.translated_title,
    seo?.title,
    fallbackTitle,
  );
  const description = pickSeoValue(
    resolved?.description,
    seo?.translated_description,
    seo?.description,
    fallbackDescription,
  );
  const keywords = pickSeoValue(
    resolved?.keywords,
    seo?.translated_keywords,
    seo?.keywords,
    fallbackKeywords,
  );

  const canonical = pickSeoValue(
    explicitCanonical,
    resolved?.canonical_url,
    seo?.canonical_url,
    canonicalPath ? `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}` : `${SITE_URL}/`,
  );

  const og = resolved?.og || {};
  const twitter = resolved?.twitter || {};
  const image = ensureAbsoluteUrl(
    pickSeoValue(
      og?.image,
      twitter?.image,
      resolved?.image,
      seo?.og_image,
      seo?.twitter_image,
      seo?.image,
      fallbackImage,
    ),
  );

  const robots = resolved?.robots || {};
  const indexAllowed = boolFromValue(
    robots?.index ?? seo?.robots_index,
    true,
  );
  const followAllowed = boolFromValue(
    robots?.follow ?? seo?.robots_follow,
    true,
  );
  const noArchive = boolFromValue(
    robots?.noarchive ?? seo?.robots_noarchive,
    false,
  );
  const noSnippet = boolFromValue(
    robots?.nosnippet ?? seo?.robots_nosnippet,
    false,
  );

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    robots: {
      index: indexAllowed,
      follow: followAllowed,
      nocache: noArchive,
      googleBot: {
        index: indexAllowed,
        follow: followAllowed,
        noimageindex: false,
        maxSnippet: noSnippet ? 0 : -1,
      },
    },
    openGraph: {
      title: pickSeoValue(og?.title, title),
      description: pickSeoValue(og?.description, description),
      url: canonical,
      type: pickSeoValue(og?.type, seo?.og_type, "website"),
      siteName: pickSeoValue(resolved?.site_name, seo?.site_name, "LMX"),
      images: image ? [image] : [],
    },
    twitter: {
      card: pickSeoValue(twitter?.card, seo?.twitter_card, "summary_large_image"),
      title: pickSeoValue(twitter?.title, og?.title, title),
      description: pickSeoValue(twitter?.description, og?.description, description),
      images: image ? [image] : [],
    },
  };
};

export const getSeoCustomSchema = (seo) => {
  const resolved = seo?.resolved || {};
  return parseJsonSafe(resolved?.schema || seo?.schema_json || seo?.schema);
};

export const buildGlobalSeoSchemas = ({ seo = null, systemSettings = null } = {}) => {
  const resolved = seo?.resolved || {};
  const siteName = pickSeoValue(
    resolved?.site_name,
    seo?.site_name,
    systemSettings?.company_name,
    "LMX",
  );
  const searchPath = pickSeoValue(
    resolved?.search_path,
    seo?.search_path,
    "/ads?query={search_term_string}",
  );
  const normalizedSearchPath = String(searchPath || "").startsWith("/")
    ? String(searchPath)
    : `/${String(searchPath || "").replace(/^\/+/, "")}`;

  const socialProfiles =
    (Array.isArray(resolved?.social_profiles) && resolved.social_profiles) ||
    parseJsonSafe(seo?.social_profiles_json) ||
    [
      systemSettings?.facebook_link,
      systemSettings?.instagram_link,
      systemSettings?.x_link,
      systemSettings?.linkedin_link,
      systemSettings?.pinterest_link,
      systemSettings?.youtube_link,
    ].filter(Boolean);

  const organizationType = pickSeoValue(
    resolved?.knowledge_graph_type,
    seo?.knowledge_graph_type,
    "Organization",
  );

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}${normalizedSearchPath}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": organizationType,
    name: pickSeoValue(
      resolved?.organization_name,
      seo?.organization_name,
      systemSettings?.company_name,
      siteName,
    ),
    url: SITE_URL,
    logo: ensureAbsoluteUrl(
      pickSeoValue(
        resolved?.organization_logo,
        seo?.organization_logo,
        systemSettings?.company_logo,
      ),
    ),
    telephone: pickSeoValue(
      resolved?.organization_phone,
      seo?.organization_phone,
      systemSettings?.company_tel1,
      "",
    ),
    email: pickSeoValue(
      resolved?.organization_email,
      seo?.organization_email,
      systemSettings?.company_email,
      "",
    ),
    address: pickSeoValue(
      resolved?.organization_address,
      seo?.organization_address,
      systemSettings?.company_address,
      "",
    ),
    sameAs: Array.isArray(socialProfiles) ? socialProfiles.filter(Boolean) : [],
  };

  const customSchema = getSeoCustomSchema(seo);
  const schemaList = [websiteSchema, organizationSchema];
  if (Array.isArray(customSchema)) {
    schemaList.push(...customSchema);
  } else if (customSchema && typeof customSchema === "object") {
    schemaList.push(customSchema);
  }

  return schemaList;
};

export { SITE_URL };

