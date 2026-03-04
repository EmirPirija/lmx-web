# Full Sweep Audit - Frontend + Backend (2026-03-04)

## Scope
- Frontend: Next.js app (`lmx-web-local`), focused on runtime errors from provided console logs.
- Backend: Laravel API (`laravel-admin`), focused on `verification-request` and `get-location` failures.

## Delivered Backend Fixes (pushed to `main`)
- Commit `7c0daf13`: Hardened verification flows and location resolution.
- Commit `54cfa072`: Guarded rollback in verification fields handler.

### Backend endpoints stabilized
1. `POST /api/send-verification-request`
- Replaced fragile upsert with `updateOrCreate` flow.
- Fixed wrong conflict key bug (`verification_fields_id` typo risk).
- Added transaction safety, stale row cleanup, field allowlist guard.

2. `GET /api/verification-request`
- Reworked response shaping and value normalization.
- Added language-aware row selection with safe fallbacks.
- Removed index/offset assumptions that could crash on empty arrays.

3. `GET /api/get-location`
- Added strict validation for `lat/lng/long/longitude` aliases.
- Added null-safe translation mapping across area/city/state/country.
- Added `timeout + retry` for Google calls.
- Added municipality fallback for coordinate lookup when city not found.
- Added clear validation error when no search/coordinates/place_id input.

4. `getVerificationFields()`
- Guarded `DB::rollBack()` by `DB::transactionLevel()`.

## Delivered Frontend Hardening (local changes)
1. `utils/Firebase.js`
- Added origin/context gating to skip push token flow in unsupported/dev-local contexts.
- Added deterministic SW registration URL builder carrying Firebase public config in query params.
- Added safe SW re-registration logic when script URL/config changes.

2. `public/firebase-messaging-sw.js`
- Removed placeholder `xxxxxxxx` Firebase config.
- Added runtime Firebase config parsing from SW URL query params.
- Added background notification handling via `onBackgroundMessage`.

3. `hooks/useRealtimeUserEvents.js`
- Hardened cleanup with guarded unsubscribe and disconnect behavior.
- Reduced `WebSocket is already in CLOSING or CLOSED state` noisy teardown path.

4. `app/api/internal/broadcasting/auth/route.js`
- Added dedicated internal proxy route for Laravel Broadcast auth.
- Routes directly to backend `/broadcasting/auth` with timeout + trace headers.
- Avoids accidental `/api/broadcasting/auth` mismatch when using catch-all proxy.

## Remaining Findings / Risks

### P1
1. Browser-extension hydration noise (`bis_skin_checked`)
- Affects hydration warnings but is external DOM mutation (extension injected attributes).
- Keep `suppressHydrationWarning` where needed, but this is not an app-logic defect.

2. FCM on localhost/dev can still fail if manually forced
- Requires Firebase console alignment:
  - authorized domains
  - VAPID key validity
  - matching project config across app + service worker.

### P2
1. Lint gate not configured in this frontend workspace
- `next lint` prompts for initial setup.
- No reliable CI lint barrier currently.

2. Mixed Firebase API styles
- App uses modern modular SDK but SW remains compat-based (`firebasejs/8` importScripts).
- Works, but long-term upgrade should unify SDK and harden release consistency.

### P3
1. `reactStrictMode: false` in `next.config.mjs`
- Hides dev-only side-effect issues and makes regressions harder to catch early.

## High-End Implementation Roadmap

### Phase 1 (stability and safety)
- Add integration tests for:
  - `verification-request` read/write lifecycle
  - `get-location` search + coordinates + place_id modes
- Add structured log fields in backend for these endpoints (`trace_id`, user_id, lang, source mode).
- Add Sentry/observability dashboard slices for:
  - location endpoint non-2xx
  - verification endpoint non-2xx
  - FCM token registration failures.

### Phase 2 (resilience and product quality)
- Add cache layer for reverse geocoding results (keyed by normalized lat/lng + lang, short TTL).
- Add backend-side rate limiting and fallback strategy for third-party map providers.
- Move service worker generation to build/runtime-managed path with explicit versioning and canary rollout.

### Phase 3 (platform hardening)
- Enable lint + type policy in CI (blocking).
- Re-enable `reactStrictMode` and fix surfaced side effects.
- Add contract tests between Next internal proxy routes and Laravel endpoints.

## Runtime Smoke (No Build, dev-only)
- Date: 2026-03-04
- Dev server: `next dev --turbopack` on `127.0.0.1:3100`

### 1) `GET /api/internal/verification-status`
- Result: `401` without auth (expected).
- Body shape is stable JSON (`UNAUTHORIZED` on missing auth guard).

### 2) `GET /api/internal/location?lat=...&lng=...`
- Result: currently `500` from upstream (`No nearby city found`) on production backend instance.
- Frontend proxy behaves correctly; failure is backend data/fallback path.
- Backend patch now implemented to remove this 500 class via:
  - reverse geocode fallback,
  - endpoint cache,
  - endpoint rate-limit,
  - structured request logging.

### 3) `POST /api/internal/broadcasting/auth`
- Before patch: unauthenticated request could bubble as `302 /login` HTML.
- After patch: normalized to API-style `401` JSON; avoids redirect body leaking into realtime auth flow.

## P1 Stability Closure (current pass)
- `hooks/useRealtimeUserEvents.js`
  - Removed explicit `unsubscribe` during teardown (race-prone when socket already closing/closed).
  - Cleanup now relies on `unbind + disconnect` and swallows teardown race safely in dev logs.
- `utils/Firebase.js`
  - Added broader transient error suppression for known FCM registration/update failures (`token-update-failed`, network/cors fetch failures) to avoid noisy fatal console spam.
- `app/api/internal/broadcasting/auth/route.js`
  - Forced JSON auth semantics (`Accept: application/json`, `X-Requested-With`).
  - Added redirect interception (`3xx -> 401 JSON`) for robust realtime auth behavior.

## Regression Test Plan (high signal)
1. Realtime auth route contract
- No auth: expect `401` JSON, never HTML redirect.
- Invalid bearer: expect `401` JSON passthrough.
- Valid bearer + private channel: expect `200` with auth payload.

2. Geolocation endpoint contract
- Search mode (`search=Sarajevo`): expect `200`, non-empty candidates.
- Coordinates mode (Sarajevo/Banja Luka/Mostar): expect `200`, never `500`.
- Invalid input (`lat=999`): expect `422`.
- Burst test: exceed threshold from same client, expect `429` with retry metadata.

3. Cache behavior
- Repeat identical location query twice within TTL.
- Verify first request marked as non-cache, second as cache hit in backend logs/meta.

4. Websocket lifecycle
- Login -> subscribe -> navigate/unmount rapidly.
- Confirm no repeated `WebSocket is already in CLOSING or CLOSED state` warnings.

5. FCM resilience
- Localhost/dev with blocked FCM or CORS-denied token update.
- Confirm no fatal error path, only controlled warning and graceful skip.

## Release-Safety Additions (implemented)
1. Internal proxy kill-switch + failover
- Axios now supports:
  - hard kill-switch (`NEXT_PUBLIC_INTERNAL_PROXY_KILL_SWITCH`)
  - one-shot failover from `/internal-api/*` to direct backend base when internal proxy returns `404/5xx/network/html`.

2. Pre-deploy smoke gate
- Added script:
  - `npm run smoke:proxy`
- Blocks deployment if critical proxy contract endpoints are broken.

3. Contract tests (route map + wiring)
- Added script:
  - `npm run test:contracts:internal-proxy`
- Verifies required internal route handlers + client wiring.

4. Incident alert signal
- Axios emits structured alert when internal proxy failures spike in 2-minute window.
- Supports optional Sentry message capture if Sentry is present.
