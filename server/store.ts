
/**
 * In-memory event store seeded from a JSON file, with filter + pagination.
 * Persistence is JSON-file based; swap for Postgres later.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import type { EventItem, EventQuery } from "./types.ts";

let seq = 0;
function newId(): string {
  return `evt_${Date.now().toString(36)}_${(seq++).toString(36)}`;
}

export class EventStore {
  private events: EventItem[] = [];
  private file: string;

  constructor(file: string) {
    this.file = path.resolve(file);
    this.load();
  }

  private load(): void {
    try {
      const raw = JSON.parse(fs.readFileSync(this.file, "utf8")) as EventItem[];
      this.events = Array.isArray(raw) ? raw : [];
    } catch {
      this.events = [];
    }
  }

  private persist(): void {
    const tmp = this.file + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(this.events, null, 2), "utf8");
    fs.renameSync(tmp, this.file);
  }

  seed(items: Array<Partial<EventItem>>): void {
    for (const it of items) {
      if (!it.name || !it.date) continue;
      this.events.push({
        id: newId(),
        name: it.name,
        venue: it.venue ?? "TBA",
        city: it.city ?? "TBA",
        date: it.date,
        genre: it.genre ?? "other",
        priceCents: it.priceCents ?? 0,
        createdAt: Date.now(),
      });
    }
    this.persist();
  }

  list(query: EventQuery): { items: EventItem[]; total: number; page: number; pageSize: number } {
    let items = [...this.events].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const needle = query.q?.toLowerCase();
    if (needle) items = items.filter((e) => e.name.toLowerCase().includes(needle) || e.venue.toLowerCase().includes(needle));
    if (query.city) items = items.filter((e) => e.city === query.city);
    if (query.genre) items = items.filter((e) => e.genre === query.genre);

    const total = items.length;
    const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 12));
    const page = Math.max(1, query.page ?? 1);
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total, page, pageSize };
  }

  genres(): string[] {
    return [...new Set(this.events.map((e) => e.genre))].sort();
  }

  cities(): string[] {
    return [...new Set(this.events.map((e) => e.city))].sort();
  }
}
