import { NextResponse } from "next/server";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 10;
const DEFAULT_ACCEPT_LANGUAGE = "bs";
const DEFAULT_USER_AGENT = "lmx-web-local/1.0 (+https://lmx.ba)";

export const dynamic = "force-dynamic";

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `nominatim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const toSafeString = (value) => String(value || "").trim();

const toSafeLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(parsed)));
};

const jsonResponse = (body, status, requestId) =>
  NextResponse.json(body, {
    status,
    headers: {
      "x-request-id": requestId,
      "cache-control": "no-store",
    },
  });

export async function GET(request) {
  const requestId = request.headers.get("x-request-id") || createRequestId();
  const sourceUrl = new URL(request.url);

  const query = toSafeString(sourceUrl.searchParams.get("q"));
  if (!query) {
    return jsonResponse(
      {
        error: true,
        code: "MISSING_QUERY",
        message: "Nedostaje parametar q.",
        data: [],
      },
      400,
      requestId,
    );
  }

  const limit = toSafeLimit(sourceUrl.searchParams.get("limit"));
  const language =
    toSafeString(sourceUrl.searchParams.get("accept-language")) ||
    toSafeString(sourceUrl.searchParams.get("lang")) ||
    toSafeString(request.headers.get("accept-language")) ||
    DEFAULT_ACCEPT_LANGUAGE;

  const nominatimUrl = new URL(NOMINATIM_BASE_URL);
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("addressdetails", "1");
  nominatimUrl.searchParams.set("polygon_geojson", "1");
  nominatimUrl.searchParams.set("countrycodes", "ba");
  nominatimUrl.searchParams.set("limit", String(limit));
  nominatimUrl.searchParams.set("accept-language", language);
  nominatimUrl.searchParams.set("q", query);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(nominatimUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent":
          process.env.NOMINATIM_USER_AGENT || DEFAULT_USER_AGENT,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return jsonResponse(
        {
          error: true,
          code: "UPSTREAM_ERROR",
          message: "Nominatim servis trenutno nije dostupan.",
          upstream_status: response.status,
          data: [],
          details: payload,
        },
        response.status,
        requestId,
      );
    }

    const results = Array.isArray(payload) ? payload : [];
    return jsonResponse(
      {
        error: false,
        data: results,
      },
      200,
      requestId,
    );
  } catch (error) {
    const isTimeout = error?.name === "AbortError";
    return jsonResponse(
      {
        error: true,
        code: isTimeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
        message: isTimeout
          ? "Nominatim zahtjev je istekao."
          : "Nominatim servis trenutno nije dostupan.",
        data: [],
      },
      isTimeout ? 504 : 502,
      requestId,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
