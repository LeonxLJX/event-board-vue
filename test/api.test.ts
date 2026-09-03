
/**
 * Run: node --experimental-strip-types test/api.test.ts
 * Tests the store + query logic directly (no network needed).
 */
import { EventStore } from "../server/store.ts";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

let failures = 0;
async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try { await fn(); console.log("PASS", name); }
  catch (e) { failures++; console.log("FAIL", name, e); }
}
function assert(cond: boolean, m = "assert"): void { if (!cond) throw new Error(m); }

function fresh(): EventStore {
  const f = path.join(os.tmpdir(), `evt-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const s = new EventStore(f);
  s.seed([
    { name: "Alpha", venue: "Club A", city: "Berlin", date: "2026-09-20", genre: "techno", priceCents: 2500 },
    { name: "Beta", venue: "Hall B", city: "Amsterdam", date: "2026-09-22", genre: "jazz", priceCents: 4000 },
    { name: "Gamma", venue: "Club C", city: "Berlin", date: "2026-10-01", genre: "techno", priceCents: 1500 },
  ]);
  return s;
}

await test("seeds and lists all events sorted by date", async () => {
  const s = fresh();
  const r = s.list({});
  assert(r.total === 3);
  assert(r.items[0]!.name === "Alpha" && r.items[2]!.name === "Gamma");
});

await test("filters by city and genre", async () => {
  const s = fresh();
  assert(s.list({ city: "Berlin" }).total === 2);
  assert(s.list({ genre: "techno" }).total === 2);
  assert(s.list({ city: "Berlin", genre: "techno" }).total === 2);
});

await test("q searches name and venue case-insensitively", async () => {
  const s = fresh();
  assert(s.list({ q: "club" }).total === 2);
  assert(s.list({ q: "BETA" }).total === 1);
});

await test("pagination slices correctly", async () => {
  const s = fresh();
  const p = s.list({ page: 2, pageSize: 2 });
  assert(p.total === 3 && p.items.length === 1 && p.items[0]!.name === "Gamma");
});

await test("facets return unique sorted genres and cities", async () => {
  const s = fresh();
  assert(JSON.stringify(s.genres()) === JSON.stringify(["jazz", "techno"]));
  assert(s.cities().length === 2);
});

await test("store persists to JSON and reloads", async () => {
  const f = path.join(os.tmpdir(), `evt-test-persist-${Date.now()}.json`);
  const s = new EventStore(f);
  s.seed([{ name: "P", venue: "V", city: "C", date: "2026-09-01", genre: "g", priceCents: 1 }]);
  const s2 = new EventStore(f);
  assert(s2.list({}).total === 1 && s2.list({}).items[0]!.name === "P");
  fs.unlinkSync(f);
});

if (failures) process.exit(1);
console.log("\nall tests passed");
