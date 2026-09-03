
/**
 * Zero-dependency HTTP server for the event board.
 *
 *   GET /api/events?q=&city=&genre=&page=&pageSize=
 *   GET /api/facets          -> { genres: [], cities: [] }
 *   Static: /  serves public/index.html
 */
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import { EventStore } from "./store.ts";
import type { EventQuery } from "./types.ts";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(here, "../public");

const store = new EventStore(path.join(here, "seed.json"));
if (store.list({}).total === 0) {
  store.seed([
    { name: "Neon Nights", venue: "Warehouse 9", city: "Berlin", date: "2026-09-20", genre: "techno", priceCents: 2500 },
    { name: "Jazz at Dusk", venue: "Blue Note", city: "Berlin", date: "2026-09-22", genre: "jazz", priceCents: 4000 },
    { name: "Indie Rising", venue: "The Basement", city: "Amsterdam", date: "2026-09-25", genre: "indie", priceCents: 1800 },
    { name: "Synthwave Night", venue: "Club Void", city: "Amsterdam", date: "2026-10-01", genre: "electronic", priceCents: 2200 },
    { name: "Acoustic Sunday", venue: "Cafe Sun", city: "Berlin", date: "2026-10-04", genre: "acoustic", priceCents: 1200 },
  ]);
}

const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  const u = new URL(req.url ?? "/", "http://localhost");
  const send = (status: number, body: unknown, type = "application/json"): void => {
    res.writeHead(status, { "content-type": type });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };

  if (u.pathname === "/api/events") {
    const q: EventQuery = {
      q: u.searchParams.get("q") ?? undefined,
      city: u.searchParams.get("city") ?? undefined,
      genre: u.searchParams.get("genre") ?? undefined,
      page: Number(u.searchParams.get("page")) || undefined,
      pageSize: Number(u.searchParams.get("pageSize")) || undefined,
    };
    return send(200, store.list(q));
  }

  if (u.pathname === "/api/facets") {
    return send(200, { genres: store.genres(), cities: store.cities() });
  }

  // static
  const rel = u.pathname === "/" ? "index.html" : u.pathname.replace(/^\/+/, "");
  const file = path.join(PUBLIC, path.normalize(rel));
  if (!file.startsWith(PUBLIC)) return send(403, "forbidden");
  const ext = path.extname(file);
  fs.readFile(file, (err, data) => {
    if (err) return send(404, "not found", "text/plain");
    send(200, data.toString(), mime[ext] ?? "application/octet-stream");
  });
});

const PORT = Number(process.env.PORT ?? 8788);
server.listen(PORT, () => console.log(`event-board-vue on http://localhost:${PORT}`));
