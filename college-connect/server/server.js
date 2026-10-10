/* College Connect - optional demo backend (no npm packages needed)
   - Serves the website files
   - Stores assignment submission status in data/submissions.json
   Run:  node server/server.js   then open http://localhost:3000
   NOTE: demo only. There is no real authentication here; use Firebase Auth +
   security rules (see README) for a real deployment. */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DATA_FILE = path.join(ROOT, "data", "submissions.json");
const PORT = process.env.PORT || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon"
};

function readDb() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (e) { return {}; }
}
function writeDb(db) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}
function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "application/json" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  // ---- API: /api/submissions/:studentId ----
  const m = url.pathname.match(/^\/api\/submissions\/([A-Za-z0-9_-]{1,20})$/);
  if (m) {
    const id = m[1].toUpperCase();
    if (req.method === "GET") {
      const db = readDb();
      return send(res, 200, { submitted: db[id] || ["A5"] });
    }
    if (req.method === "PUT") {
      let body = "";
      req.on("data", (c) => { body += c; if (body.length > 10000) req.destroy(); });
      req.on("end", () => {
        try {
          const j = JSON.parse(body);
          if (!Array.isArray(j.submitted) || !j.submitted.every((x) => /^A\d{1,3}$/.test(x))) {
            return send(res, 400, { error: "submitted must be an array of assignment IDs" });
          }
          const db = readDb();
          db[id] = j.submitted;
          writeDb(db);
          send(res, 200, { ok: true });
        } catch (e) { send(res, 400, { error: "Invalid JSON" }); }
      });
      return;
    }
    return send(res, 405, { error: "Method not allowed" });
  }
  if (url.pathname.startsWith("/api/")) return send(res, 404, { error: "Not found" });

  // ---- static files ----
  if (req.method !== "GET") return send(res, 405, "Method not allowed", "text/plain");
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/") rel = "/index.html";
  const file = path.normalize(path.join(ROOT, rel));
  const allowed = [path.join(ROOT, "css"), path.join(ROOT, "js")];
  const isPage = path.dirname(file) === ROOT && file.endsWith(".html");
  if (!isPage && !allowed.some((d) => file.startsWith(d + path.sep))) return send(res, 403, "Forbidden", "text/plain");
  fs.readFile(file, (err, buf) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    send(res, 200, buf, TYPES[path.extname(file)] || "application/octet-stream");
  });
});

server.listen(PORT, () => console.log("College Connect running at http://localhost:" + PORT));
