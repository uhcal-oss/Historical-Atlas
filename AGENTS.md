# HistoAtlas — AGENTS.md

## Quick start

```bash
# Install dependencies (both frontend and server)
cd src && npm install
cd ../server && npm install

# Start server (serves frontend static files + API)
cd server && npm run serve
# → http://localhost:3000
```

## Architecture

| Path | Role |
|---|---|
| `src/` | Vanilla JS frontend (Leaflet + Turf.js + jQuery) |
| `server/` | Express.js backend (MariaDB, JWT auth) |
| `server/app.js:43` | Serves `src/` as static files, fallback to `src/index.html` |

**Entry points:**
- `src/index.html` — landing/home page
- `src/histoAtlas.html` — map editor (all scripts loaded via `<script>` tags in order)
- `src/histoAtlasMapbox.html` — Mapbox GL version of the editor

**API routes** (Express, all under `/api/`):
- `/api/user/*` — login, registration, password reset, newsletter
- `/api/map/*` — CRUD for maps (save, load, list, delete)
- `/api/iconMarker/*` — custom marker icons

## Key details

- **No build tooling.** No bundler, no linter, no formatter, no typecheck. No test suite (`npm test` is a placeholder).
- **Config files (not tracked):** `src/config/config.json` (`serverUrl`, `mapboxAccessToken`), `server/params/config.json` (MariaDB creds, JWT secret, mail settings). Copy from the `.json` files already in those dirs.
- **Database:** MariaDB (port 3306). JWT auth middleware at `server/middleware/auth.js`.
- **i18n:** `src/dictionary/` — `dictionary_en.json` and `dictionary_fr.json` loaded by `dictionary.js`.
- **CSS:** `src/histoAtlas.css` (main), `src/timeSlider.css`, `src/styles/index.css` (landing page).
- **Cache busting:** All script/style URLs use `?v=10` or `?v=10.1` query params — update these when modifying referenced files.
- **History/undo:** `src/actions/actionsList.js` manages undo/redo via an ActionList class.
- **License:** AGPL-3.0.
