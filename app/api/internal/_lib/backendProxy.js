import { NextResponse } from "next/server";

const DEFAULT_TIMEOUT_MS = 9000;

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `proxy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizePath = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getBackendApiBaseUrl = () => {
  const apiHost = String(
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "",
  ).trim();
  const endpointRaw = String(
    process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_END_POINT || "/api",
  ).trim();

  if (!apiHost) return null;

  const normalizedHost = apiHost.replace(/\/+$/, "");
  const normalizedEndpoint = normalizePath(endpointRaw);
  return `${normalizedHost}/${normalizedEndpoint}`;
};

const buildProxyHeaders = (request, requestId) => {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("X-Request-Id", requestId);

  const authHeader = request.headers.get("authorization");
  if (authHeader) headers.set("Authorization", authHeader);

  const langHeader = request.headers.get("content-language");
  if (langHeader) headers.set("Content-Language", langHeader);

  return headers;
};

const jsonResponse = (body, status, requestId) =>
  NextResponse.json(body, {
    status,
    headers: {
      "x-request-id": requestId,
      "x-correlation-id": requestId,
    },
  });

export const proxyBackendGet = async ({
  request,
  upstreamPath,
  allowedQueryKeys = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  fallbackMessage = "Upstream service unavailable.",
  requireAuth = false,
}) => {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const backendBase = getBackendApiBaseUrl();

  if (!backendBase) {
    return jsonResponse(
      {
        error: true,
        code: "BACKEND_BASE_URL_MISSING",
        message: "Backend API base URL is not configured.",
        trace_id: requestId,
        data: null,
      },
      500,
      requestId,
    );
  }

  if (requireAuth && !request.headers.get("authorization")) {
    return jsonResponse(
      {
        error: true,
        code: "UNAUTHORIZED",
        message: "Authentication required.",
        trace_id: requestId,
        data: null,
      },
      401,
      requestId,
    );
  }

  const sourceUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `${backendBase}/${normalizePath(upstreamPath)}`,
  );

  sourceUrl.searchParams.forEach((value, key) => {
    if (allowedQueryKeys && !allowedQueryKeys.has(key)) return;
    upstreamUrl.searchParams.append(key, value);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: buildProxyHeaders(request, requestId),
      cache: "no-store",
      signal: controller.signal,
    });

    const raw = await upstreamResponse.text();
    const parsed = safeJsonParse(raw);

    if (upstreamResponse.ok) {
      if (parsed && typeof parsed === "object") {
        return jsonResponse(parsed, upstreamResponse.status, requestId);
      }
      return jsonResponse(
        {
          error: false,
          data: raw,
          trace_id: requestId,
        },
        upstreamResponse.status,
        requestId,
      );
    }

    return jsonResponse(
      {
        error: true,
        code: "UPSTREAM_ERROR",
        message: parsed?.message || fallbackMessage,
        upstream_status: upstreamResponse.status,
        trace_id: requestId,
        data: parsed?.data ?? null,
        details: parsed?.errors ?? null,
      },
      upstreamResponse.status,
      requestId,
    );
  } catch (error) {
    const isTimeout = error?.name === "AbortError";
    return jsonResponse(
      {
        error: true,
        code: isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
        message: isTimeout
          ? "Zahtjev prema backend servisu je istekao."
          : fallbackMessage,
        trace_id: requestId,
        data: null,
      },
      isTimeout ? 504 : 502,
      requestId,
    );
  } finally {
    clearTimeout(timeoutId);
  }
};
