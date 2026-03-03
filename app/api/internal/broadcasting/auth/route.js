import { NextResponse } from "next/server";

const TIMEOUT_MS = 10000;

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `proxy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const getBackendHost = () => {
  const host = String(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "").trim();
  return host ? host.replace(/\/+$/, "") : null;
};

const buildHeaders = (request, requestId, contentType) => {
  const headers = new Headers();
  headers.set("Accept", request.headers.get("accept") || "application/json");
  headers.set("X-Request-Id", requestId);

  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("Authorization", authorization);

  const contentLanguage = request.headers.get("content-language");
  if (contentLanguage) headers.set("Content-Language", contentLanguage);

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return headers;
};

const proxyBroadcastAuth = async (request) => {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const backendHost = getBackendHost();

  if (!backendHost) {
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

  const upstreamUrl = `${backendHost}/broadcasting/auth`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const rawBody = await request.text();
    const contentType = request.headers.get("content-type") || "application/x-www-form-urlencoded";

    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: buildHeaders(request, requestId, contentType),
      body: rawBody,
      signal: controller.signal,
      cache: "no-store",
      redirect: "manual",
    });

    const responseText = await upstreamResponse.text();
    const responseHeaders = new Headers();
    responseHeaders.set("x-request-id", requestId);
    const upstreamContentType = upstreamResponse.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }

    return new NextResponse(responseText, {
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
    clearTimeout(timeout);
  }
};

export async function POST(request) {
  return proxyBroadcastAuth(request);
}

export async function OPTIONS(request) {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST,OPTIONS",
      "x-request-id": requestId,
    },
  });
}
