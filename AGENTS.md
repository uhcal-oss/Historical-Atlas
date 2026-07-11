# HistoAtlas — AGENTS.md

## Quick start

```bash
# Install dependencies (server postinstall auto-installs src/)
cd server && npm install

# Start server (serves frontend static files + API)
cd server && npm run serve
# → http://localhost:3000
```

## Architecture

| Path | Role |
|---|---|
| `src/` | Vanilla JS frontend (Leaflet + Turf.js + jQuery) |
| `server/` | Express.js backend (MongoDB/Mongoose, JWT auth) |
| `server/app.js:43` | Serves `src/` as static files, fallback to `src/index.html` |
| `scripts/` | Python utilities for tile generation (requires Pillow) |

**Entry points:**
- `src/index.html` — landing/home page
- `src/histoAtlas.html` — map editor (all scripts loaded via `<script>` tags in order)
- `src/histoAtlasMapbox.html` — Mapbox GL version of the editor
- `server/server.js` — Express server entry; connects to MongoDB, then listens on port 3000

**API routes** (Express, all under `/api/`):
- `/api/user/*` — login, registration, password reset, newsletter
- `/api/map/*` — CRUD for maps (save, load, list, delete)
- `/api/iconMarker/*` — custom marker icons

## Key details

- **No build tooling.** No bundler, no linter, no formatter, no typecheck. No test suite (`npm test` is a placeholder).
- **Config files (not tracked):** `src/config/config.json` (`serverUrl`, `mapboxAccessToken`), `server/params/config.json` (JWT secret, mail settings), `server/.env` (`MONGODB_URI`). Copy from the `.json` files already in those dirs.
- **Database:** MongoDB. URI from `server/.env` (`MONGODB_URI`). Mongoose models in `server/models/` (User, Map, IconMarker, Newsletter, PasswordReset). JWT auth middleware at `server/middleware/auth.js`.
- **File storage:** Maps saved as JSON in `server/files/{userId}/`. Icon markers in `server/icons/{userId}/`. Logs in `server/logs/`.
- **Frontend module pattern:** No ES modules. All JS files define globals loaded via `<script>` tags in HTML. Script order matters — classes must be loaded before they're instantiated.
- **i18n:** `src/dictionary/` — `dictionary_en.json` and `dictionary_fr.json` loaded by `dictionary.js`. Dictionary must be loaded before `Main` class instantiation (see `histoAtlas.html:148-152`).
- **CSS:** `src/histoAtlas.css` (main), `src/timeSlider.css`, `src/styles/index.css` (landing page).
- **Cache busting:** All script/style URLs use `?v=10` or `?v=10.1` query params — update these when modifying referenced files.
- **History/undo:** `src/actions/actionsList.js` manages undo/redo via an ActionList class (max 10 actions).
- **Server body limit:** `bodyParser.json({ limit: '100mb' })` — large map payloads expected.
- **License:** AGPL-3.0.
