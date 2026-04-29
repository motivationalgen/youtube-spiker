import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getContentType(filePath) {
  return mimeTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function serveFile(filePath, res) {
  const contentType = getContentType(filePath);
  const data = await fs.readFile(filePath);
  res.writeHead(200, { "Content-Type": contentType });
  res.end(data);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === "/") {
      await serveFile(join(distDir, "index.html"), res);
      return;
    }

    const filePath = join(distDir, pathname);
    try {
      await serveFile(filePath, res);
    } catch {
      await serveFile(join(distDir, "index.html"), res);
    }
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${port}`);
});
