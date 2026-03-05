import { NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "../_lib/backendProxy";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEFAULT_TIMEOUT_MS = 15000;
const ALLOW_HEADER = "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS";

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `proxy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeSegment = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

const extractSafePath = (params) => {
  const segments = Array.isArray(params?.path) ? params.path : [];
  const normalized = segments.map((segment) => normalizeSegment(segment));
  const hasUnsafeSegment = normalized.some(
    (segment) => !segment || segment === "." || segment === ".." || segment.includes(".."),
  );

  if (hasUnsafeSegment) return null;
  return normalized.join("/");
};

const getForwardHeaders = (request, requestId, hasBody) => {
  const headers = new Headers();
  headers.set("Accept", request.headers.get("accept") || "application/json");
  headers.set("X-Request-Id", requestId);

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
        headers: {
          "x-request-id": requestId,
          "x-correlation-id": requestId,
        },
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
        headers: {
          "x-request-id": requestId,
          "x-correlation-id": requestId,
        },
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
      headers: getForwardHeaders(request, requestId, hasBody),
      body,
      cache: "no-store",
      signal: controller.signal,
      redirect: "manual",
    });

    const upstreamBody = await upstreamResponse.arrayBuffer();
    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }
    responseHeaders.set("x-request-id", requestId);
    responseHeaders.set("x-correlation-id", requestId);

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
        headers: {
          "x-request-id": requestId,
          "x-correlation-id": requestId,
        },
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

export async function OPTIONS(request) {
  const requestId = request?.headers?.get("x-request-id") || createRequestId();
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: ALLOW_HEADER,
      "x-request-id": requestId,
      "x-correlation-id": requestId,
    },
  });
}
