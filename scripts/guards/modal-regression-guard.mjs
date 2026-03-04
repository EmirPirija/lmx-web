import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ALLOWLIST_PATH = path.join(
  ROOT,
  "scripts/guards/modal-regression-allowlist.json",
);
const TARGET_DIRS = ["app", "components"];
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

const SUSPICIOUS_PATTERNS = [
  {
    key: "createPortal",
    regex: /\bcreatePortal\s*\(/g,
  },
  {
    key: "fixed-inset-overlay",
    regex: /\bfixed\s+inset-0\b/g,
  },
  {
    key: "fixed-bottom-sheet",
    regex: /\bfixed\s+inset-x-0\s+bottom-0\b/g,
  },
  {
    key: "fixed-left-rail",
    regex: /\bfixed\s+left-0\s+top-0\s+bottom-0\b/g,
  },
];

const shouldSkipFile = (filePath) => {
  if (!EXTENSIONS.has(path.extname(filePath))) return true;
  if (filePath.includes("/node_modules/")) return true;
  if (filePath.includes("/.next/")) return true;
  if (filePath.includes("/components/ui/")) return true;
  return false;
};

const readAllowlist = () => {
  const raw = fs.readFileSync(ALLOWLIST_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return new Set((parsed.allowedFiles || []).map((entry) => String(entry).trim()));
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

const collectSuspiciousFiles = () => {
  const matched = new Map();

  for (const dir of TARGET_DIRS) {
    const absoluteDir = path.join(ROOT, dir);
    const files = walkFiles(absoluteDir);

    for (const absoluteFile of files) {
      const normalizedAbsolute = absoluteFile.replace(/\\/g, "/");
      if (shouldSkipFile(normalizedAbsolute)) continue;

      const source = fs.readFileSync(absoluteFile, "utf8");
      const reasons = [];

      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.regex.test(source)) {
          reasons.push(pattern.key);
        }
        pattern.regex.lastIndex = 0;
      }

      if (!reasons.length) continue;

      const relativeFile = path.relative(ROOT, absoluteFile).replace(/\\/g, "/");
      matched.set(relativeFile, reasons);
    }
  }

  return matched;
};

const updateAllowlist = (files) => {
  const next = {
    description:
      "Files with approved legacy/custom modal patterns. New entries require review.",
    allowedFiles: [...files].sort((a, b) => a.localeCompare(b)),
  };
  fs.writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
};

const main = () => {
  const shouldUpdate = process.argv.includes("--update-allowlist");
  const matched = collectSuspiciousFiles();
  const matchedFiles = new Set(matched.keys());

  if (shouldUpdate) {
    updateAllowlist(matchedFiles);
    console.log(
      `Updated modal regression allowlist with ${matchedFiles.size} file(s).`,
    );
    return;
  }

  const allowlist = readAllowlist();
  const unexpected = [...matchedFiles].filter((file) => !allowlist.has(file));
  const stale = [...allowlist].filter((file) => !matchedFiles.has(file));

  if (unexpected.length > 0) {
    console.error("Modal regression guard failed.");
    console.error(
      "New custom modal patterns detected outside shared modal foundation:",
    );
    for (const file of unexpected) {
      const reasons = matched.get(file) || [];
      console.error(` - ${file} [${reasons.join(", ")}]`);
    }
    console.error(
      "Use shared modal primitives (`Dialog`/`Sheet`/`Drawer`) or update allowlist intentionally.",
    );
    process.exit(1);
  }

  console.log(
    `Modal regression guard passed (${matchedFiles.size} tracked file(s), 0 unexpected).`,
  );

  if (stale.length > 0) {
    console.warn(
      "Modal allowlist contains stale entries that no longer match suspicious patterns:",
    );
    for (const file of stale) {
      console.warn(` - ${file}`);
    }
    console.warn(
      "Run `npm run guard:modal-regression:update` to refresh the baseline.",
    );
  }
};

main();
