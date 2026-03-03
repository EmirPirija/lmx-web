const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs/promises");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = Number(process.env.NODE_PORT || 8003);
const wellKnownRoot = path.resolve(process.cwd(), ".well-known");

const getWellKnownFilePath = (pathname) => {
  const relativePath = pathname.replace(/^\/\.well-known\/+/, "");
  if (!relativePath) return null;

  const normalized = path.posix.normalize(relativePath);
  if (normalized.startsWith("../") || normalized.includes("/../")) return null;

  const absolutePath = path.resolve(wellKnownRoot, normalized);
  const isInsideWellKnown =
    absolutePath === wellKnownRoot ||
    absolutePath.startsWith(`${wellKnownRoot}${path.sep}`);

  return isInsideWellKnown ? absolutePath : null;
};

const getWellKnownContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  return "application/octet-stream";
};

app.prepare().then(() => {
  createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    if (pathname && pathname.startsWith("/.well-known/")) {
      const filePath = getWellKnownFilePath(pathname);
      if (!filePath) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Bad Request");
        return;
      }

      try {
        const fileContent = await fs.readFile(filePath);
        res.writeHead(200, {
          "Content-Type": getWellKnownContentType(filePath),
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        });
        res.end(fileContent);
        return;
      } catch (error) {
        if (error?.code !== "ENOENT") {
          console.error("Error serving .well-known file:", error);
        }
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not Found");
        return;
      }
    }

    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
  });
});
