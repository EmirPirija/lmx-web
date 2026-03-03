import { proxyBackendGet } from "../_lib/backendProxy";

const ALLOWED_QUERY_KEYS = new Set([
  "lat",
  "lng",
  "long",
  "longitude",
  "lang",
  "search",
  "place_id",
  "session_id",
]);

export async function GET(request) {
  return proxyBackendGet({
    request,
    upstreamPath: "get-location",
    allowedQueryKeys: ALLOWED_QUERY_KEYS,
    fallbackMessage: "Location lookup unavailable.",
  });
}
