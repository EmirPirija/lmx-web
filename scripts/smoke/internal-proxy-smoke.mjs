#!/usr/bin/env node

import process from "node:process";

const args = process.argv.slice(2);
const argValue = (name) => {
  const direct = args.find((entry) => entry.startsWith(`--${name}=`));
  if (direct) return direct.slice(name.length + 3);
  const index = args.indexOf(`--${name}`);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return undefined;
};

const baseUrl = String(
  argValue("base") || process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000",
).replace(/\/+$/, "");

const bearerToken = String(
  argValue("token") || process.env.SMOKE_BEARER_TOKEN || "",
).trim();

const strictAuthMode = (() => {
  const raw = String(
    argValue("strict-auth") || process.env.SMOKE_STRICT_AUTH || "",
  )
    .trim()
    .toLowerCase();
  return raw === "1" || raw === "true";
})();

const commonHeaders = {
  Accept: "application/json",
};

if (bearerToken) {
  commonHeaders.Authorization = `Bearer ${bearerToken}`;
}

const expectAuthStatus = strictAuthMode ? [200] : [200, 401];
const expectBroadcastStatus = strictAuthMode ? [200, 403] : [200, 401, 403];

const checks = [
  {
    id: "settings",
    method: "GET",
    path: "/internal-api/get-system-settings",
    expectedStatus: [200],
    expectJson: true,
    rejectHtml: true,
  },
  {
    id: "categories",
    method: "GET",
    path: "/internal-api/get-categories?page=1&per_page=50",
    expectedStatus: [200],
    expectJson: true,
    rejectHtml: true,
  },
  {
    id: "items",
    method: "GET",
    path: "/internal-api/get-item?sort_by=new-to-old&status=approved&page=1&limit=20",
    expectedStatus: [200],
    expectJson: true,
    rejectHtml: true,
  },
  {
    id: "slider",
    method: "GET",
    path: "/internal-api/get-slider",
    expectedStatus: [200],
    expectJson: true,
    rejectHtml: true,
  },
  {
    id: "live-session",
    method: "POST",
    path: "/internal-api/track/live-session",
    expectedStatus: [200, 201, 204],
    expectJson: true,
    rejectHtml: true,
    body: JSON.stringify({
      visitor_id: "smoke_vis",
      session_id: "smoke_sess",
      event_type: "heartbeat",
      page_path: "/smoke",
      page_url: `${baseUrl}/smoke`,
      page_title: "Smoke",
      referrer_url: "",
      device_type: "desktop",
    }),
    headers: {
      "Content-Type": "application/json",
    },
  },
  {
    id: "location",
    method: "GET",
    path: "/internal-api/location?lat=43.865243381064&lng=18.420180484632&lang=bs",
    expectedStatus: [200],
    expectJson: true,
    rejectHtml: true,
  },
  {
    id: "verification-status",
    method: "GET",
    path: "/internal-api/verification-status",
    expectedStatus: expectAuthStatus,
    expectJson: true,
    rejectHtml: true,
  },
  {
    id: "broadcast-auth",
    method: "POST",
    path: "/internal-api/broadcasting/auth",
    expectedStatus: expectBroadcastStatus,
    expectJson: true,
    rejectHtml: true,
    body: "socket_id=1234.5678&channel_name=private-user.1",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  },
];

const isLikelyHtml = (payload) => {
  const normalized = String(payload || "").trim().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html");
};

const results = [];

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;
  const headers = {
    ...commonHeaders,
    ...(check.headers || {}),
  };

  const startedAt = Date.now();
  let response;
  let payloadText = "";
  let jsonError = null;

  try {
    response = await fetch(url, {
      method: check.method,
      headers,
      body: check.body,
      redirect: "manual",
    });
    payloadText = await response.text();
  } catch (error) {
    results.push({
      id: check.id,
      ok: false,
      reason: `network_error: ${error?.message || error}`,
      status: null,
      durationMs: Date.now() - startedAt,
    });
    continue;
  }

  const durationMs = Date.now() - startedAt;
  const status = Number(response.status);
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const isJson = contentType.includes("application/json");
  let parsedJson = null;

  if (isJson && payloadText.trim() !== "") {
    try {
      parsedJson = JSON.parse(payloadText);
    } catch (error) {
      jsonError = error;
    }
  }

  const passStatus = check.expectedStatus.includes(status);
  const passJson = !check.expectJson || isJson;
  const passJsonDecode = !(check.expectJson && isJson && jsonError);
  const passHtml = !check.rejectHtml || !isLikelyHtml(payloadText);

  const ok = passStatus && passJson && passJsonDecode && passHtml;
  const reasonParts = [];
  if (!passStatus) reasonParts.push(`status=${status}`);
  if (!passJson) reasonParts.push(`content-type=${contentType || "n/a"}`);
  if (!passJsonDecode) reasonParts.push("invalid_json");
  if (!passHtml) reasonParts.push("html_payload_detected");

  results.push({
    id: check.id,
    ok,
    status,
    durationMs,
    reason: reasonParts.join(", "),
    traceId:
      response.headers.get("x-request-id") ||
      parsedJson?.trace_id ||
      parsedJson?.request_id ||
      null,
  });
}

const failed = results.filter((entry) => !entry.ok);

for (const entry of results) {
  const mark = entry.ok ? "PASS" : "FAIL";
  const tracePart = entry.traceId ? ` trace=${entry.traceId}` : "";
  const reasonPart = entry.reason ? ` reason=${entry.reason}` : "";
  console.log(
    `[${mark}] ${entry.id} status=${entry.status ?? "n/a"} duration_ms=${entry.durationMs}${tracePart}${reasonPart}`,
  );
}

if (failed.length > 0) {
  console.error(
    `\nSmoke gate failed: ${failed.length}/${results.length} checks did not pass.`,
  );
  process.exit(1);
}

console.log(`\nSmoke gate passed: ${results.length}/${results.length} checks OK.`);
