#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();

const readFile = (relativePath) =>
  fs.readFileSync(path.join(rootDir, relativePath), "utf8");

const exists = (relativePath) => fs.existsSync(path.join(rootDir, relativePath));

const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const assertFileContains = (relativePath, snippets) => {
  assert(exists(relativePath), `Missing file: ${relativePath}`);
  if (!exists(relativePath)) return;
  const content = readFile(relativePath);
  for (const snippet of snippets) {
    assert(
      content.includes(snippet),
      `File ${relativePath} does not include required snippet: ${snippet}`,
    );
  }
};

assertFileContains("app/internal-api/[...path]/route.js", [
  'from "../../api/internal/[...path]/route"',
  "export {",
]);
assertFileContains("app/internal-api/location/route.js", [
  'from "../../api/internal/location/route"',
  "export { GET }",
]);
assertFileContains("app/internal-api/verification-status/route.js", [
  'from "../../api/internal/verification-status/route"',
  "export { GET }",
]);
assertFileContains("app/internal-api/broadcasting/auth/route.js", [
  'from "../../../api/internal/broadcasting/auth/route"',
  "export { OPTIONS, POST }",
]);

assertFileContains("api/AxiosInterceptors.jsx", [
  "NEXT_PUBLIC_INTERNAL_PROXY_KILL_SWITCH",
  "NEXT_PUBLIC_INTERNAL_PROXY_FALLBACK_ENABLED",
  "buildInternalProxyFailoverConfig",
  "recordInternalProxyIncident",
]);

assertFileContains("utils/api.js", [
  'export const INTERNAL_LOCATION_ENDPOINT = "location";',
  'export const INTERNAL_VERIFICATION_STATUS_ENDPOINT =',
  '"verification-status";',
]);

assertFileContains("hooks/useRealtimeUserEvents.js", [
  '"/internal-api/broadcasting/auth"',
]);

const runtimeBase = String(process.env.CONTRACT_BASE_URL || "").trim().replace(/\/+$/, "");

const runtimeChecks = async () => {
  if (!runtimeBase) return;

  const execute = async ({ id, method, path: requestPath, expected }) => {
    let response;
    let body = "";
    try {
      response = await fetch(`${runtimeBase}${requestPath}`, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type":
            method === "POST"
              ? "application/x-www-form-urlencoded"
              : "application/json",
        },
        body:
          method === "POST"
            ? "socket_id=1234.5678&channel_name=private-user.1"
            : undefined,
      });
      body = await response.text();
    } catch (error) {
      failures.push(`[runtime:${id}] network error: ${error?.message || error}`);
      return;
    }

    if (!expected.includes(response.status)) {
      failures.push(
        `[runtime:${id}] expected status in ${expected.join(",")} but got ${response.status}`,
      );
    }

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("application/json")) {
      failures.push(`[runtime:${id}] expected JSON content-type, got ${contentType || "n/a"}`);
    }

    const trimmed = body.trim().toLowerCase();
    if (trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html")) {
      failures.push(`[runtime:${id}] HTML payload returned instead of JSON`);
    }
  };

  await execute({
    id: "settings",
    method: "GET",
    path: "/internal-api/get-system-settings",
    expected: [200],
  });

  await execute({
    id: "broadcast-auth",
    method: "POST",
    path: "/internal-api/broadcasting/auth",
    expected: [200, 401, 403],
  });
};

await runtimeChecks();

if (failures.length > 0) {
  console.error("Internal proxy contract test failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Internal proxy contract test passed.");
