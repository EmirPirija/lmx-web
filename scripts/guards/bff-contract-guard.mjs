import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components", "hooks", "lib", "utils"];
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

const FORBIDDEN_PATTERNS = [
  {
    key: "fetch-next-public-api-url",
    regex:
      /\bfetch\s*\(\s*`[^`]*process\.env\.NEXT_PUBLIC_API_URL[^`]*`/g,
  },
  {
    key: "axios-next-public-api-url",
    regex:
      /\baxios\.(?:get|post|put|patch|delete)\s*\(\s*`[^`]*process\.env\.NEXT_PUBLIC_API_URL[^`]*`/g,
  },
  {
    key: "absolute-admin-api-fetch",
    regex: /\b(fetch|axios\.(?:get|post|put|patch|delete))\s*\(\s*["']https?:\/\/admin\.lmx\.ba\/api/gi,
  },
];

const shouldSkipFile = (filePath) => {
  if (!EXTENSIONS.has(path.extname(filePath))) return true;
  if (filePath.includes("/node_modules/")) return true;
  if (filePath.includes("/.next/")) return true;
  if (filePath.includes("/app/api/")) return true;
  return false;
};

const isClientScopeFile = (source, relativePath) => {
  if (relativePath.startsWith("components/")) return true;
  if (relativePath.startsWith("hooks/")) return true;
  if (relativePath.startsWith("utils/")) return true;
  if (relativePath.startsWith("lib/")) {
    return /^\s*["']use client["'];?/m.test(source);
  }
  return /^\s*["']use client["'];?/m.test(source);
};

const walkFiles = (dirPath, result = []) => {
  if (!fs.existsSync(dirPath)) return result;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolutePath, result);
      continue;
    }
    result.push(absolutePath);
  }

  return result;
};

const collectViolations = () => {
  const violations = [];

  for (const dir of TARGET_DIRS) {
    const absoluteDir = path.join(ROOT, dir);
    const files = walkFiles(absoluteDir);

    for (const absoluteFile of files) {
      const normalizedAbsolute = absoluteFile.replace(/\\/g, "/");
      if (shouldSkipFile(normalizedAbsolute)) continue;

      const relativeFile = path.relative(ROOT, absoluteFile).replace(/\\/g, "/");
      const source = fs.readFileSync(absoluteFile, "utf8");

      if (!isClientScopeFile(source, relativeFile)) continue;

      const reasons = [];
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.regex.test(source)) {
          reasons.push(pattern.key);
        }
        pattern.regex.lastIndex = 0;
      }

      if (!reasons.length) continue;
      violations.push({
        file: relativeFile,
        reasons,
      });
    }
  }

  return violations;
};

const main = () => {
  const violations = collectViolations();
  if (!violations.length) {
    console.log(
      "BFF contract guard passed (no direct external browser API calls detected).",
    );
    return;
  }

  console.error("BFF contract guard failed.");
  console.error(
    "Client-side direct external API calls detected. Use /internal-api/* (or /api/internal/*) instead.",
  );
  for (const violation of violations) {
    console.error(` - ${violation.file} [${violation.reasons.join(", ")}]`);
  }
  process.exit(1);
};

main();
