import { NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "../_lib/backendProxy";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEFAULT_TIMEOUT_MS = 15000;
const ALLOW_HEADER = "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS";
const CACHEABLE_GET_PATH_PREFIXES = [
  "get-item",
  "get-items",
  "get-categories",
  "get-slider",
  "get-featured-section",
  "get-system-settings",
  "get-map-items",
  "seo-settings",
  "faq",
  "blogs",
  "blog-tags",
  "countries",
  "states",
  "cities",
  "areas",
  "get-languages",
];
const DEFAULT_CACHEABLE_PROXY_MAX_AGE_SECONDS = 30;
const DEFAULT_CACHEABLE_PROXY_STALE_SECONDS = 90;
const CACHE_PROFILE_BY_PREFIX = [
  { prefix: "get-categories", maxAge: 180, stale: 360 },
  { prefix: "get-featured-section", maxAge: 45, stale: 120 },
  { prefix: "get-slider", maxAge: 180, stale: 360 },
  { prefix: "seo-settings", maxAge: 300, stale: 600 },
  { prefix: "faq", maxAge: 300, stale: 600 },
  { prefix: "blogs", maxAge: 120, stale: 300 },
  { prefix: "get-item", maxAge: 25, stale: 90 },
  { prefix: "get-items", maxAge: 25, stale: 90 },
];
const CACHE_CONTROL_NO_STORE = "no-store";
const PROXY_MEMORY_CACHE_MAX_ENTRIES = 120;
const proxyMemoryCache = new Map();

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `proxy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeSegment = (value) => String(value || "").replace(/^\/+|\/+$/g, "");
const normalizePathLower = (value) => normalizeSegment(value).toLowerCase();

const extractSafePath = (params) => {
  const segments = Array.isArray(params?.path) ? params.path : [];
  const normalized = segments.map((segment) => normalizeSegment(segment));
  const hasUnsafeSegment = normalized.some(
    (segment) => !segment || segment === "." || segment === ".." || segment.includes(".."),
  );

  if (hasUnsafeSegment) return null;
  return normalized.join("/");
};

const getForwardHeaders = (
  request,
  requestId,
  hasBody,
  includeRequestId = true,
) => {
  const headers = new Headers();
  headers.set("Accept", request.headers.get("accept") || "application/json");
  if (includeRequestId) {
    headers.set("X-Request-Id", requestId);
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader) headers.set("Authorization", authHeader);

  const languageHeader = request.headers.get("content-language");
  if (languageHeader) headers.set("Content-Language", languageHeader);

  if (hasBody) {
    const contentType = request.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
  }

  return headers;
};

const isCacheableProxyGet = ({ method, safePath, request }) => {
  if (method !== "GET") return false;
  if (request.headers.get("authorization")) return false;

  const normalizedPath = normalizePathLower(safePath);
  if (!normalizedPath) return false;

  return CACHEABLE_GET_PATH_PREFIXES.some(
    (prefix) =>
      normalizedPath === prefix ||
      normalizedPath.startsWith(`${prefix}/`),
  );
};

const resolveProxyCacheProfile = (safePath) => {
  const normalizedPath = normalizePathLower(safePath);
  const match = CACHE_PROFILE_BY_PREFIX.find(
    (entry) =>
      normalizedPath === entry.prefix ||
      normalizedPath.startsWith(`${entry.prefix}/`),
  );

  if (match) {
    return {
      maxAge: match.maxAge,
      stale: match.stale,
    };
  }

  return {
    maxAge: DEFAULT_CACHEABLE_PROXY_MAX_AGE_SECONDS,
    stale: DEFAULT_CACHEABLE_PROXY_STALE_SECONDS,
  };
};

const buildProxyMemoryCacheKey = ({ upstreamUrl, request }) => {
  const language = String(request.headers.get("content-language") || "")
    .trim()
    .toLowerCase();
  const accept = String(request.headers.get("accept") || "application/json")
    .trim()
    .toLowerCase();
  return `${upstreamUrl.toString()}|lang:${language}|accept:${accept}`;
};

const getProxyMemoryCacheEntry = (key) => {
  const cached = proxyMemoryCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    proxyMemoryCache.delete(key);
    return null;
  }
  return cached;
};

const setProxyMemoryCacheEntry = (key, entry) => {
  proxyMemoryCache.set(key, entry);
  if (proxyMemoryCache.size <= PROXY_MEMORY_CACHE_MAX_ENTRIES) return;
  const oldestKey = proxyMemoryCache.keys().next().value;
  if (oldestKey) {
    proxyMemoryCache.delete(oldestKey);
  }
};

const proxy = async (request, paramsLike) => {
  const params = await paramsLike;
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const backendBase = getBackendApiBaseUrl();

  if (!backendBase) {
    return NextResponse.json(
      {
        error: true,
        code: "BACKEND_BASE_URL_MISSING",
        message: "Backend API base URL is not configured.",
        trace_id: requestId,
      },
      {
        status: 500,
        headers: { "x-request-id": requestId },
      },
    );
  }

  const safePath = extractSafePath(params);
  if (!safePath) {
    return NextResponse.json(
      {
        error: true,
        code: "INVALID_PROXY_PATH",
        message: "Invalid proxy path.",
        trace_id: requestId,
      },
      {
        status: 400,
        headers: { "x-request-id": requestId },
      },
    );
  }

  const upstreamUrl = new URL(`${backendBase}/${safePath}`);
  const incomingUrl = new URL(request.url);
  incomingUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const method = String(request.method || "GET").toUpperCase();
  const hasBody = METHODS_WITH_BODY.has(method);
  const shouldUseProxyCache = isCacheableProxyGet({
    method,
    safePath,
    request,
  });
  const cacheProfile = shouldUseProxyCache
    ? resolveProxyCacheProfile(safePath)
    : null;
  const cacheMaxAgeSeconds = cacheProfile?.maxAge
    ?? DEFAULT_CACHEABLE_PROXY_MAX_AGE_SECONDS;
  const cacheStaleSeconds = cacheProfile?.stale
    ?? DEFAULT_CACHEABLE_PROXY_STALE_SECONDS;
  const cacheControlValue = shouldUseProxyCache
    ? `public, max-age=${cacheMaxAgeSeconds}, stale-while-revalidate=${cacheStaleSeconds}`
    : CACHE_CONTROL_NO_STORE;
  const proxyMemoryCacheKey = shouldUseProxyCache
    ? buildProxyMemoryCacheKey({ upstreamUrl, request })
    : null;

  if (proxyMemoryCacheKey) {
    const cachedEntry = getProxyMemoryCacheEntry(proxyMemoryCacheKey);
    if (cachedEntry) {
      const responseHeaders = new Headers(cachedEntry.headers);
      responseHeaders.set("x-request-id", requestId);
      responseHeaders.set("x-proxy-cache", "HIT");
      return new NextResponse(cachedEntry.body.slice(0), {
        status: cachedEntry.status,
        headers: responseHeaders,
      });
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    let body = undefined;
    if (hasBody) {
      const rawBody = await request.arrayBuffer();
      if (rawBody.byteLength > 0) {
        body = rawBody;
      }
    }

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method,
      headers: getForwardHeaders(
        request,
        requestId,
        hasBody,
        !shouldUseProxyCache,
      ),
      body,
      cache: shouldUseProxyCache ? "force-cache" : "no-store",
      next: shouldUseProxyCache
        ? { revalidate: cacheMaxAgeSeconds }
        : undefined,
      signal: controller.signal,
      redirect: "manual",
    });

    const upstreamBody = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }
    responseHeaders.set(
      "cache-control",
      cacheControlValue,
    );
    responseHeaders.set("x-request-id", requestId);
    if (shouldUseProxyCache) {
      responseHeaders.set("x-proxy-cache", "MISS");
    }

    if (shouldUseProxyCache && proxyMemoryCacheKey) {
      const bodyBytes = new Uint8Array(upstreamBody);
      setProxyMemoryCacheEntry(proxyMemoryCacheKey, {
        status: upstreamResponse.status,
        headers: Array.from(responseHeaders.entries()),
        body: bodyBytes,
        expiresAt: Date.now() + cacheMaxAgeSeconds * 1000,
      });
    }

    return new NextResponse(upstreamBody, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const isTimeout = error?.name === "AbortError";
    return NextResponse.json(
      {
        error: true,
        code: isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
        message: isTimeout
          ? "Zahtjev prema backend servisu je istekao."
          : "Backend servis trenutno nije dostupan.",
        trace_id: requestId,
      },
      {
        status: isTimeout ? 504 : 502,
        headers: { "x-request-id": requestId },
      },
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function GET(request, context) {
  return proxy(request, context?.params);
}

export async function POST(request, context) {
  return proxy(request, context?.params);
}

export async function PUT(request, context) {
  return proxy(request, context?.params);
}

export async function PATCH(request, context) {
  return proxy(request, context?.params);
}

export async function DELETE(request, context) {
  return proxy(request, context?.params);
}

export async function HEAD(request, context) {
  return proxy(request, context?.params);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: ALLOW_HEADER,
    },
  });
}
