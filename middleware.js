import { NextResponse } from 'next/server'

const SETTINGS_CACHE_TTL_MS = 30_000;
const SETTINGS_TIMEOUT_MS = 3_000;

let cachedMaintenanceState = {
  value: null,
  expiresAt: 0,
};

const createRequestId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const toBooleanFlag = (value, fallback = false) => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes") {
    return true;
  }
  if (normalized === "0" || normalized === "false" || normalized === "off") {
    return false;
  }
  return fallback;
};

const normalizePath = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

const getBackendControlPlaneUrl = () => {
  const apiHost = String(
    process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "",
  ).trim();
  const endpointRaw = String(
    process.env.API_ENDPOINT || process.env.NEXT_PUBLIC_END_POINT || "/api",
  ).trim();

  if (!apiHost) return null;
  const host = apiHost.replace(/\/+$/, "");
  const endpoint = normalizePath(endpointRaw);
  return `${host}/${endpoint}/frontend-control-plane`;
};

const getEnvMaintenanceMode = () =>
  String(process.env.MAINTENANCE_MODE || "").trim().toLowerCase() === "true";

const resolveMaintenanceMode = async () => {
  const envMaintenance = getEnvMaintenanceMode();
  if (envMaintenance) return true;

  const now = Date.now();
  if (cachedMaintenanceState.expiresAt > now && cachedMaintenanceState.value !== null) {
    return cachedMaintenanceState.value;
  }

  const settingsUrl = getBackendControlPlaneUrl();
  if (!settingsUrl) return envMaintenance;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SETTINGS_TIMEOUT_MS);
  try {
    const response = await fetch(settingsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    const value = toBooleanFlag(
      data?.data?.controls?.maintenance_mode ?? data?.data?.maintenance_mode,
      envMaintenance,
    );
    cachedMaintenanceState = {
      value,
      expiresAt: now + SETTINGS_CACHE_TTL_MS,
    };
    return value;
  } catch {
    return envMaintenance;
  } finally {
    clearTimeout(timeoutId);
  }
};

export async function middleware(req) {
  const isMaintenanceMode = await resolveMaintenanceMode();
  const requestId = req.headers.get("x-request-id") || createRequestId();
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  if (isMaintenanceMode) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            body { 
              background: black; 
              color: #fff; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              font-family: sans-serif; 
              margin: 0; 
              overflow: hidden;
            }
            .content { 
              text-align: center; 
              animation: fadeIn 1.2s ease-out forwards; 
            }
            img { margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.1)); }
            h1 { letter-spacing: 8px; font-weight: 300; margin: 0; }
            p { color: white; font-size: 20px; margin-top: 10px; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="content">
            <img src="https://poslovi.lmx.ba/wp-content/uploads/2025/11/imgi_1_6888a4cb9bc945.718931351753785547-4.png" alt="lmx.ba" width="512">
            <p>Nešto domaće.</p>
            <p>Nešto drugačije.</p>
            <p>Nešto naše.</p>
            <p>Uskoro s vama.</p>
          </div>
        </body>
      </html>`,
      {
        status: 503,
        headers: {
          'content-type': 'text/html',
          'cache-control': 'no-store',
          'x-request-id': requestId,
          'x-correlation-id': requestId,
        }
      }
    );
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-correlation-id", requestId);
  return response;
}

export const config = {
  matcher: '/((?!api|internal-api|_next/static|_next/image|favicon.ico).*)',
}
