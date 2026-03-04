# Internal Proxy Release Safety

## Objectives
- Prevent full-page functional outage when internal proxy routes fail.
- Block deploys when critical proxy contracts are broken.
- Surface fast signal when `404/5xx` spikes hit `/internal-api/*`.

## Runtime Controls
- `NEXT_PUBLIC_USE_INTERNAL_API_PROXY` (default `true`)
  - Enables internal proxy mode.
- `NEXT_PUBLIC_INTERNAL_PROXY_BASE_PATH` (default `/internal-api`)
  - Internal proxy prefix used by client requests.
- `NEXT_PUBLIC_INTERNAL_PROXY_KILL_SWITCH` (default `false`)
  - When `true`, client bypasses internal proxy and goes direct to backend API base.
- `NEXT_PUBLIC_INTERNAL_PROXY_FALLBACK_ENABLED` (default `true`)
  - If internal proxy request fails (`404/5xx/network/html`), retry once against direct backend base.

## Incident Alerting (client-side signal)
When internal proxy errors spike in short window, Axios emits:
- Console error:
  - `[ALERT][internal-proxy] incident spike detected`
- Browser event:
  - `window.dispatchEvent(new CustomEvent("lmx:internal-proxy-alert", { detail }))`
- Optional Sentry capture (if global `Sentry` exists):
  - `captureMessage("internal_proxy_incident_spike", ...)`

Tunable envs:
- `NEXT_PUBLIC_INTERNAL_PROXY_ALERT_THRESHOLD` (default `8`)
- `NEXT_PUBLIC_INTERNAL_PROXY_ALERT_WINDOW_MS` (default `120000`)
- `NEXT_PUBLIC_INTERNAL_PROXY_ALERT_COOLDOWN_MS` (default `120000`)

## Pre-Deploy Gate (hard stop)
Run this before every deploy:

```bash
npm run smoke:proxy -- --base http://127.0.0.1:3000
```

Critical checks:
1. `get-system-settings`
2. `get-categories`
3. `get-item`
4. `get-slider`
5. `track/live-session`
6. `location`
7. `verification-status`
8. `broadcasting/auth`

Script exits non-zero on failure.

## Contract Test
Static contract test for route map + proxy wiring:

```bash
npm run test:contracts:internal-proxy
```

Optional runtime contract check:

```bash
CONTRACT_BASE_URL=http://127.0.0.1:3000 npm run test:contracts:internal-proxy
```

## Fast Rollback Playbook
1. Set `NEXT_PUBLIC_INTERNAL_PROXY_KILL_SWITCH=true`.
2. Redeploy frontend config.
3. Verify with:
   - `npm run smoke:proxy -- --base https://<frontend-host>`
4. Investigate internal proxy handler routing separately.
