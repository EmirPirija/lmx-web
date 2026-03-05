const DEFAULT_FALLBACK = {
  title: process.env.NEXT_PUBLIC_META_TITLE || "LMX",
  description: process.env.NEXT_PUBLIC_META_DESCRIPTION || "",
  keywords: process.env.NEXT_PUBLIC_META_kEYWORDS || "",
};

const normalizeBaseUrl = () => {
  const host = String(process.env.NEXT_PUBLIC_API_URL || "").trim();
  const endpoint = String(process.env.NEXT_PUBLIC_END_POINT || "/api")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!host) return null;
  const normalizedHost = host.replace(/\/+$/, "");
  return `${normalizedHost}/${endpoint}`;
};

const withQuery = (path, query = {}) => {
  const entries = Object.entries(query).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  if (!entries.length) return path;

  const params = new URLSearchParams();
  entries.forEach(([key, value]) => {
    params.set(key, String(value));
  });

  return `${path}?${params.toString()}`;
};

const sanitizeKeywords = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }
  return value || DEFAULT_FALLBACK.keywords;
};

export const shouldSkipSeo = () => process.env.NEXT_PUBLIC_SEO === "false";

export const fetchBackendJson = async ({
  path,
  query,
  langCode = "en",
  revalidate = 300,
}) => {
  const baseUrl = normalizeBaseUrl();
  if (!baseUrl) return null;

  const requestUrl = `${baseUrl}/${withQuery(String(path || "").replace(/^\/+/, ""), query)}`;
  const response = await fetch(requestUrl, {
    headers: {
      Accept: "application/json",
      "Content-Language": langCode || "en",
    },
    next: {
      revalidate,
    },
  });

  if (!response.ok) {
    throw new Error(`SEO request failed (${response.status}) for ${path}`);
  }

  return response.json();
};

export const buildSeoMetadata = ({
  entry,
  fallback = {},
  preferTranslated = true,
}) => {
  const title = preferTranslated
    ? entry?.translated_title || entry?.title || fallback.title || DEFAULT_FALLBACK.title
    : entry?.title || entry?.translated_title || fallback.title || DEFAULT_FALLBACK.title;

  const description = preferTranslated
    ? entry?.translated_description ||
      entry?.description ||
      fallback.description ||
      DEFAULT_FALLBACK.description
    : entry?.description ||
      entry?.translated_description ||
      fallback.description ||
      DEFAULT_FALLBACK.description;

  const keywords = sanitizeKeywords(
    (preferTranslated ? entry?.translated_keywords : entry?.keywords) ||
      entry?.keywords ||
      entry?.translated_keywords ||
      fallback.keywords ||
      DEFAULT_FALLBACK.keywords,
  );

  return {
    title,
    description,
    openGraph: {
      images: entry?.image ? [entry.image] : [],
    },
    keywords,
  };
};

export const fetchSeoPageMetadata = async ({
  page,
  langCode = "en",
  revalidate = 300,
  fallback = {},
  preferTranslated = true,
}) => {
  if (shouldSkipSeo()) return undefined;

  try {
    const payload = await fetchBackendJson({
      path: "seo-settings",
      query: { page },
      langCode,
      revalidate,
    });
    const entry = payload?.data?.[0] || null;
    return buildSeoMetadata({
      entry,
      fallback,
      preferTranslated,
    });
  } catch {
    return {
      title: fallback.title || DEFAULT_FALLBACK.title,
      description: fallback.description || DEFAULT_FALLBACK.description,
      keywords: fallback.keywords || DEFAULT_FALLBACK.keywords,
      openGraph: {
        images: [],
      },
    };
  }
};

