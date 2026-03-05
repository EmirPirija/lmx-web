import { NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "../_lib/backendProxy";

const MAX_EVENTS_PER_BATCH = 50;

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `telemetry_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeEvents = (payload) => {
  const list = Array.isArray(payload?.events) ? payload.events : [];
  return list
    .slice(0, MAX_EVENTS_PER_BATCH)
    .filter((entry) => entry && typeof entry === "object");
};

const getUpstreamPath = () =>
  String(process.env.INTERNAL_TELEMETRY_UPSTREAM_PATH || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

const forwardToUpstreamIfConfigured = async ({
  request,
  requestId,
  records,
}) => {
  const upstreamPath = getUpstreamPath();
  if (!upstreamPath) return { forwarded: false };

  const backendBase = getBackendApiBaseUrl();
  if (!backendBase) return { forwarded: false };

  const upstreamUrl = `${backendBase}/${upstreamPath}`;
  const auth = request.headers.get("authorization");
  const lang = request.headers.get("content-language");

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  headers.set("X-Request-Id", requestId);
  if (auth) headers.set("Authorization", auth);
  if (lang) headers.set("Content-Language", lang);

  try {
    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({ events: records }),
    });
    return {
      forwarded: true,
      upstreamStatus: response.status,
    };
  } catch {
    return { forwarded: false };
  }
};

export async function POST(request) {
  const requestId = request.headers.get("x-request-id") || createRequestId();

  try {
    const payload = await request.json();
    const events = normalizeEvents(payload);

    const forwardMeta = await forwardToUpstreamIfConfigured({
      request,
      requestId,
      records: events,
    });

    return NextResponse.json(
      {
        error: false,
        accepted: true,
        received: events.length,
        forwarded: forwardMeta.forwarded,
        upstream_status: forwardMeta.upstreamStatus || null,
        trace_id: requestId,
      },
      {
        status: 202,
        headers: {
          "x-request-id": requestId,
          "x-correlation-id": requestId,
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        error: false,
        accepted: true,
        received: 0,
        forwarded: false,
        trace_id: requestId,
      },
      {
        status: 202,
        headers: {
          "x-request-id": requestId,
          "x-correlation-id": requestId,
        },
      },
    );
  }
}

export async function OPTIONS(request) {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST,OPTIONS",
      "x-request-id": requestId,
      "x-correlation-id": requestId,
    },
  });
}
