# Full Sweep Audit - 2026-03-03

## Scope
- Frontend + edge/server layer in this repository.
- Runtime signals from browser logs (hydration warnings, CORS, 500s, websocket teardown noise, dialog accessibility warnings).
- Security and resilience posture (network reliability, sanitization, CSP, persistence strategy).

## Implemented In This Sweep
1. Network resilience and reliability core
- Added retry with exponential backoff + jitter for idempotent transient failures.
- Added endpoint-level circuit breaker for unstable critical endpoints.
- Added normalized error envelope on Axios errors (`error.normalized`).
- Added request trace id propagation (`X-Request-Id`) and response duration metadata.
- File: `api/AxiosInterceptors.jsx`.

2. BFF-style internal API routes for unstable endpoints
- Added server proxy utility with timeout, auth/header passthrough, normalized upstream error handling.
- Added route handlers:
  - `/api/internal/location` -> backend `get-location`
  - `/api/internal/verification-status` -> backend `verification-request`
- Added generic catch-all route:
  - `/api/internal/[...path]` -> backend `/api/{path}` with method passthrough.
- Files:
  - `app/api/internal/_lib/backendProxy.js`
  - `app/api/internal/location/route.js`
  - `app/api/internal/verification-status/route.js`
  - `app/api/internal/[...path]/route.js`

3. Critical endpoint migration to internal routes
- `getLocationApi` now uses internal BFF endpoint.
- `getVerificationStatusApi` now uses internal BFF endpoint.
- File: `utils/api.js`.

4. Browser-side global transport upgrade
- Axios client now defaults to internal BFF transport in browser (`/api/internal`) unless explicitly disabled via `NEXT_PUBLIC_USE_INTERNAL_API_PROXY=false`.
- This removes direct browser dependency on cross-origin backend for most API calls.
- File: `api/AxiosInterceptors.jsx`.

5. Push notifications / Firebase hardening
- Stabilized Firebase app initialization (singleton semantics).
- Enforced service worker readiness before token retrieval.
- Soft-fail for token update failures to avoid noisy crashes.
- Local/unsupported contexts are safely skipped.
- Files:
  - `utils/Firebase.js`
  - `components/Layout/PushNotificationLayout.jsx`

6. Accessibility + hydration warning reduction
- Dialog component now auto-injects hidden fallback `Title` and `Description` when missing.
- Eliminates frequent Radix warnings for missing accessible metadata.
- File: `components/ui/dialog.jsx`.

7. HTML sanitization hardening
- Replaced regex-based sanitizer with DOMPurify via `isomorphic-dompurify`.
- File: `utils/sanitizeHtml.js`.

8. Dependency security hardening
- Upgraded `axios` to patched version (`^1.13.6`).
- Added `isomorphic-dompurify` dependency.
- `npm audit --omit=dev` now reports zero vulnerabilities.
- Files:
  - `package.json`
  - `package-lock.json`

9. Custom server hardening
- Removed blocking sync file reads for `/.well-known`.
- Added path traversal protection and stricter content-type handling.
- File: `server.js`.

10. State and runtime safety
- Added null guard in auth reducer update path.
- Reworked persisted Redux slices to avoid persisting auth-sensitive state.
- Files:
  - `redux/reducer/authSlice.js`
  - `redux/store/index.js`

11. UI/editor consistency improvements
- Rich text editors now sync `value` changes reactively (not just mount-only).
- Files:
  - `components/PagesComponent/AdsListing/ComponentTwo.jsx`
  - `components/PagesComponent/EditListing/EditComponentOne.jsx`

12. Console noise reduction
- Debug logs are gated in production for tracking and websocket layers.
- Files:
  - `hooks/useItemTracking.js`
  - `hooks/useWebSocket.js`
  - `hooks/useRealtimeUserEvents.js`

13. Payment and OAuth message-channel hardening
- Replaced brittle `event.origin === NEXT_PUBLIC_API_URL` check with normalized allowed-origin set (`window`, API origin, web origin).
- Added stricter `postMessage` validation for OAuth popup (`event.source === popup` + allowed origin only).
- Files:
  - `components/PagesComponent/Subscription/PaymentModal.jsx`
  - `utils/socialOAuth.js`

14. Hardcoded cross-origin API call removal
- Removed direct `https://admin.lmx.ba/api/get-item` browser fetch from search/autocomplete flow.
- Unified to environment-driven/internal-proxy URL building.
- Files:
  - `components/PagesComponent/Home/Search.jsx`
  - `components/PagesComponent/AdsListing/ComponentOne.jsx`

15. Push-notification dev safety gating
- Push token flow now defaults to off in non-production unless explicitly enabled (`NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS_DEV=true`).
- Added guard for missing VAPID key to avoid unnecessary token-update failures.
- Files:
  - `components/Layout/PushNotificationLayout.jsx`
  - `utils/Firebase.js`

16. Proxy route protocol completeness
- Added `HEAD` passthrough and `OPTIONS` response on catch-all internal proxy route.
- File:
  - `app/api/internal/[...path]/route.js`

17. Reverse-geocode request deduplication and caching
- Added in-flight request coalescing + short-term response cache for `get-location`.
- Prevents duplicate parallel calls for identical coordinates and reduces backend pressure/noise on unstable responses.
- File:
  - `utils/api.js`

## Outstanding Findings (Prioritized)

### P0 - Backend reliability / data integrity
1. `get-location` endpoint intermittently returns 500.
- Symptom: repeated runtime 500 in product/location flows.
- Current mitigation: BFF + graceful fallback to prevent UI collapse.
- Needed backend action: fix root cause, add deterministic contract + SLO/error budget.

2. `verification-request` endpoint intermittently returns 500.
- Symptom: profile/verification status calls fail under load or backend instability.
- Current mitigation: BFF + fallback shape.
- Needed backend action: endpoint stability and explicit error taxonomy.

### P1 - Rich text editor modernization
1. `document.execCommand` is deprecated.
- Still present in listing/edit editors.
- Recommended: migrate to Lexical or Tiptap with schema and server-side sanitation policy.

### P1 - Security posture tightening
1. CSP still allows `'unsafe-inline'` for scripts/styles.
- Current status: `'unsafe-eval'` constrained to dev only.
- Recommended next step: nonce/hash-based CSP rollout to remove `'unsafe-inline'` in prod.

### P2 - Frontend hygiene and observability
1. High volume of debug/console statements remains across codebase.
- Current spot check: dozens of `console.log` still present.
- Recommended: central logger with environment-based sinks and sampling.

2. `reactStrictMode` remains disabled.
- Recommended: phased enablement by app sections after fixing strict-mode side effects.

3. Remaining direct client calls tied to external API URL env.
- High-traffic runtime flows now route through BFF.
- Low-risk utility paths still read `NEXT_PUBLIC_API_URL` as fallback and should be fully standardized to one transport policy.

## Notes On Logged Browser Errors
1. Hydration mismatch entries containing `bis_skin_checked` are extension-injected attributes (external to app source).
2. `popup.js ... reading 'enabled'` appears extension-related, not first-party bundle origin.
3. Firebase registration PATCH CORS failures are now soft-handled to avoid user-facing breakage in local/dev contexts.

## Recommended Next Sprint (High-End)
1. Migrate all frontend API calls to BFF route handlers (`/api/internal/*`) with auth passthrough and consistent error envelope.
2. Add backend trace correlation (`trace_id`) end-to-end (frontend request id -> backend logs -> APM).
3. Introduce typed API contracts (zod/io-ts) for request/response runtime validation at BFF boundary.
4. Replace deprecated rich text stack with modern editor and strict allowlist for HTML output.
5. Roll out production CSP level-up (nonce/hash scripts, remove unsafe-inline gradually).
6. Add Sentry + OpenTelemetry spans for API latency, timeout and retry dashboards.
