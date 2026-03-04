import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const ALLOWLIST_PATH = path.join(
  ROOT,
  "scripts/guards/verified-avatar-allowlist.json",
);
const TARGET_DIRS = ["app", "components"];
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

const shouldSkipFile = (filePath) => {
  if (!EXTENSIONS.has(path.extname(filePath))) return true;
  if (filePath.includes("/node_modules/")) return true;
  if (filePath.includes("/.next/")) return true;
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

const parseAllowlist = () => {
  const raw = fs.readFileSync(ALLOWLIST_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return new Set((parsed.allowedInstances || []).map((entry) => String(entry).trim()));
};

const writeAllowlist = (instances) => {
  const next = {
    description:
      "Instances intentionally using verificationSource without showVerifiedBadge.",
    allowedInstances: [...instances].sort((a, b) => a.localeCompare(b)),
  };
  fs.writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
};

const collectContractState = () => {
  const instances = [];
  const violations = [];

  for (const dir of TARGET_DIRS) {
    const absoluteDir = path.join(ROOT, dir);
    const files = walkFiles(absoluteDir);

    for (const absoluteFile of files) {
      const normalizedAbsolute = absoluteFile.replace(/\\/g, "/");
      if (shouldSkipFile(normalizedAbsolute)) continue;

      const relativeFile = path.relative(ROOT, absoluteFile).replace(/\\/g, "/");
      const lines = fs.readFileSync(absoluteFile, "utf8").split(/\r?\n/);

      let inAvatarTag = false;
      let avatarStartLine = 0;
      let hasVerificationSource = false;
      let hasVerifiedBadgeProp = false;

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const lineNo = index + 1;

        if (!inAvatarTag && line.includes("<UserAvatarMedia")) {
          inAvatarTag = true;
          avatarStartLine = lineNo;
          hasVerificationSource = line.includes("verificationSource=");
          hasVerifiedBadgeProp = line.includes("showVerifiedBadge");

          const closesOnSameLine = line.includes("/>") || line.includes(">");
          if (closesOnSameLine) {
            if (hasVerificationSource) {
              instances.push(`${relativeFile}:${avatarStartLine}`);
            }
            if (hasVerificationSource && !hasVerifiedBadgeProp) {
              violations.push(`${relativeFile}:${avatarStartLine}`);
            }
            inAvatarTag = false;
          }
          continue;
        }

        if (!inAvatarTag) continue;

        if (line.includes("verificationSource=")) {
          hasVerificationSource = true;
        }

        if (line.includes("showVerifiedBadge")) {
          hasVerifiedBadgeProp = true;
        }

        if (line.includes("/>") || line.includes(">")) {
          if (hasVerificationSource) {
            instances.push(`${relativeFile}:${avatarStartLine}`);
          }
          if (hasVerificationSource && !hasVerifiedBadgeProp) {
            violations.push(`${relativeFile}:${avatarStartLine}`);
          }
          inAvatarTag = false;
          avatarStartLine = 0;
          hasVerificationSource = false;
          hasVerifiedBadgeProp = false;
        }
      }
    }
  }

  return {
    instances,
    violations,
  };
};

const main = () => {
  const shouldUpdate = process.argv.includes("--update-allowlist");
  const { instances, violations } = collectContractState();
  const foundSet = new Set(violations);

  if (shouldUpdate) {
    writeAllowlist(foundSet);
    console.log(
      `Updated verified-avatar allowlist with ${foundSet.size} instance(s).`,
    );
    return;
  }

  const allowlist = parseAllowlist();
  const unexpected = [...foundSet].filter((entry) => !allowlist.has(entry));
  const stale = [...allowlist].filter((entry) => !foundSet.has(entry));

  if (unexpected.length > 0) {
    console.error("Verified avatar contract guard failed.");
    console.error(
      "UserAvatarMedia with verificationSource must also declare showVerifiedBadge:",
    );
    for (const entry of unexpected) {
      console.error(` - ${entry}`);
    }
    console.error(
      "Fix the component usage or intentionally allowlist the instance.",
    );
    process.exit(1);
  }

  console.log(
    `Verified avatar contract guard passed (${instances.length} contract instance(s), 0 unexpected).`,
  );

  if (stale.length > 0) {
    console.warn("Verified avatar allowlist has stale entries:");
    for (const entry of stale) {
      console.warn(` - ${entry}`);
    }
    console.warn(
      "Run `npm run guard:verified-avatar:update` to refresh the baseline.",
    );
  }
};

main();
