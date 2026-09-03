# event-board-vue

An **event discovery board**: Vue 3 frontend (loaded via CDN, zero build step) over a zero-dependency Node HTTP backend with JSON persistence, search/filter/paginate.

A compact full-stack reference for "small directory / listing" freelance builds - it demonstrates the complete slice: typed API, query engine, static file serving, and a reactive UI that talks to it.

## Stack

- **Backend** - Node `http` (no Express), strict TypeScript, JSON-file persistence with atomic rename.
- **Frontend** - Vue 3 `createApp` + Composition API, loaded from a CDN `<script>` (no bundler, no `node_modules`).

## Run it

```bash
npm test          # 6 tests against the store + query logic
npm start         # http://localhost:8788
```

## API

```
GET /api/events?q=&city=&genre=&page=&pageSize=
GET /api/facets      -> { genres: [], cities: [] }
GET /                -> Vue SPA (public/index.html)
```

## Notes

- Facets are derived from the data (no hardcoded dropdowns), so a new city appears automatically.
- Static serving resolves paths against `public/` and blocks traversal outside it.
- Seed data lives in `server/seed.json`; the server auto-seeds on first run.

MIT License.
