import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["app", "components"];
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

const FILE_NAME_HINT = /(modal|popup|drawer|sheet)/i;
const SKIP_FILE_HINT = /(skeleton|loading|demo|pool|story)/i;

const MODAL_IMPORT_PATTERNS = [
  /from\s+["']@\/components\/ui\/dialog["']/,
  /from\s+["']@\/components\/ui\/sheet["']/,
  /from\s+["']@\/components\/ui\/drawer["']/,
  /from\s+["']@\/components\/ui\/alert-dialog["']/,
  /from\s+["']\.\.\/ui\/dialog["']/,
  /from\s+["']\.\.\/ui\/sheet["']/,
  /from\s+["']\.\.\/ui\/drawer["']/,
  /from\s+["']\.\.\/ui\/alert-dialog["']/,
  /from\s+["']\.\.\/\.\.\/ui\/dialog["']/,
  /from\s+["']\.\.\/\.\.\/ui\/sheet["']/,
  /from\s+["']\.\.\/\.\.\/ui\/drawer["']/,
  /from\s+["']\.\.\/\.\.\/ui\/alert-dialog["']/,
];

const MODAL_BEHAVIOR_HINTS = [
  /\bopen=\{/,
  /\bonOpenChange\b/,
  /\bisOpen\b/,
  /\bonClose\b/,
  /\bonHide\b/,
  /\bDialog\b/,
  /\bSheet\b/,
  /\bDrawer\b/,
];

const shouldSkipFile = (relativePath) => {
  const normalized = relativePath.replace(/\\/g, "/");
  if (!EXTENSIONS.has(path.extname(normalized))) return true;
  if (normalized.includes("/node_modules/")) return true;
  if (normalized.includes("/.next/")) return true;
  if (normalized.startsWith("components/ui/")) return true;
  return false;
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

const hasModalImport = (source) =>
  MODAL_IMPORT_PATTERNS.some((pattern) => pattern.test(source));

const hasModalBehavior = (source) =>
  MODAL_BEHAVIOR_HINTS.some((pattern) => pattern.test(source));

const collectViolations = () => {
  const violations = [];
  for (const dir of TARGET_DIRS) {
    const absoluteDir = path.join(ROOT, dir);
    const files = walkFiles(absoluteDir);
    for (const absoluteFile of files) {
      const relativeFile = path.relative(ROOT, absoluteFile).replace(/\\/g, "/");
      if (shouldSkipFile(relativeFile)) continue;

      const fileName = path.basename(relativeFile);
      if (!FILE_NAME_HINT.test(fileName)) continue;
      if (SKIP_FILE_HINT.test(fileName)) continue;

      const source = fs.readFileSync(absoluteFile, "utf8");
      if (!hasModalBehavior(source)) continue;

      if (!hasModalImport(source)) {
        violations.push(relativeFile);
      }
    }
  }
  return violations;
};

const main = () => {
  const violations = collectViolations();
  if (violations.length === 0) {
    console.log("Modal standard guard passed (all modal-like files use shared primitives).");
    return;
  }

  console.error("Modal standard guard failed.");
  console.error(
    "Modal-like components must use shared primitives (Dialog/Sheet/Drawer/AlertDialog).",
  );
  for (const file of violations) {
    console.error(` - ${file}`);
  }
  process.exit(1);
};

main();
