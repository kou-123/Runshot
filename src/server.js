import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLatestId, listRuns, readEvents, readMeta } from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function webRoot() {
  return path.join(__dirname, "..", "web");
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function serveStatic(res, urlPath) {
  const root = webRoot();
  let rel = decodeURIComponent(urlPath.split("?")[0] || "/");
  if (rel === "/") rel = "/index.html";
  const filePath = path.normalize(path.join(root, rel));
  if (!filePath.startsWith(root)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    try {
      const index = await fs.readFile(path.join(root, "index.html"));
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(index);
    } catch {
      res.writeHead(404).end("UI missing");
    }
  }
}

export async function startServer(port = 0) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const { pathname } = url;

    try {
      if (pathname === "/api/runs" && req.method === "GET") {
        sendJson(res, 200, await listRuns());
        return;
      }

      if (pathname === "/api/latest" && req.method === "GET") {
        const id = await getLatestId();
        if (!id) {
          sendJson(res, 404, { error: "No runs yet" });
          return;
        }
        const meta = await readMeta(id);
        const events = await readEvents(id);
        sendJson(res, 200, { meta, events });
        return;
      }

      const runMatch = pathname.match(/^\/api\/runs\/([^/]+)$/);
      if (runMatch && req.method === "GET") {
        const id = decodeURIComponent(runMatch[1]);
        const meta = await readMeta(id);
        const events = await readEvents(id);
        sendJson(res, 200, { meta, events });
        return;
      }

      if (pathname === "/api/health") {
        sendJson(res, 200, { ok: true });
        return;
      }

      await serveStatic(res, pathname);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      sendJson(res, 500, { error: message });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind local server");
  }

  return {
    port: address.port,
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
