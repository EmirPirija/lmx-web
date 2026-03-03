import { proxyBackendGet } from "../_lib/backendProxy";

export async function GET(request) {
  return proxyBackendGet({
    request,
    upstreamPath: "verification-request",
    fallbackMessage: "Verification status unavailable.",
    requireAuth: true,
  });
}
