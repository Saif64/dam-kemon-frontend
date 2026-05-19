# dam-kemon-frontend

> **Damkemon** is a Bangladesh price-comparison engine. The backend nightly
> indexes 60+ BD e-commerce shops into MongoDB; this frontend lets users
> search the indexed catalog instantly with grouped, cross-shop pricing.
>
> Vite + React 18. The companion backend lives at
> [DolfinMind/dam-kemon-backend](https://github.com/DolfinMind/dam-kemon-backend).

---

## Stack

| | |
|---|---|
| Build | Vite 5 |
| UI | React 18 + react-router-dom 7 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| HTTP | axios |
| Charts | recharts |
| Icons | lucide-react |
| Lint | ESLint 9 (flat config) |

---

## Quick start

### Prerequisites

- **Node 18+** and npm
- The [backend](https://github.com/DolfinMind/dam-kemon-backend) running on
  `http://localhost:8080`. The backend needs a MongoDB Atlas URI configured —
  see its README for the 5-minute setup. The Vite dev server proxies `/api`
  to it.

### 1. Install

```bash
npm install
```

### 2. Configure (optional)

```bash
cp .env.example .env
```

Defaults work out of the box for local dev — `VITE_API_URL` left blank means
axios hits `/api` and Vite proxies to `localhost:8080`. Override only when
the backend is on a different origin:

```env
VITE_API_URL=https://api.damkemon.com
```

### 3. Run

```bash
npm run dev          # http://localhost:5173
```

### 4. Build

```bash
npm run build        # → dist/
npm run preview      # local preview of the built bundle
```

---

## Pages

| Route | File | Notes |
|---|---|---|
| `/` | [Home.jsx](src/pages/Home.jsx) | Hero + search bar + how-it-works |
| `/search?q=...` | [SearchResults.jsx](src/pages/SearchResults.jsx) | DB-first instant search, grouped per-product card with price table |
| `/product/:idOrSlug` | [ProductDetail.jsx](src/pages/ProductDetail.jsx) | Tabs: Prices, History. Reads product from router state when available so it works even when the backend can't refetch by ID |
| `/compare?ids=A,B,C` | [Compare.jsx](src/pages/Compare.jsx) | 4-up grid + spec table, winner crown per row |
| `/sellers` | [Sellers.jsx](src/pages/Sellers.jsx) | Facebook seller directory (manual curation only) |
| `/dashboard` | [Dashboard.jsx](src/pages/Dashboard.jsx) | Live `/api/dashboard/stats` — products / shops / reviews / price points |

---

## Search UX

The home and navbar [SearchBar](src/components/SearchBar.jsx) renders an
**autosuggest** dropdown (debounced 180ms, ↑/↓/Enter/Esc keyboard nav)
backed by `GET /api/search/suggest?q=...`. Selecting a row goes straight to
the product page; hitting Enter without a selection runs a full search.

The [SearchResults](src/pages/SearchResults.jsx) page calls
`GET /api/search?q=...` — synchronous, instant, served from the indexed
catalog. Each [SearchProductCard](src/components/SearchProductCard.jsx)
shows headline price + a compact **per-seller price table** below it (one
row per shop, cheapest highlighted, "Buy" deep-link per row).

---

## Layout

```
src/
├── api/api.js               # axios client + endpoint helpers
├── App.jsx                  # router + layout shell
├── main.jsx                 # Vite entry
├── index.css                # Tailwind directives + globals
├── assets/
├── pages/
│   ├── Home.jsx             # hero + search
│   ├── SearchResults.jsx    # DB-first list
│   ├── ProductDetail.jsx    # prices + history tabs
│   ├── Compare.jsx          # up to 4 products side by side
│   ├── Sellers.jsx          # FB sellers directory
│   └── Dashboard.jsx        # live catalog stats
└── components/
    ├── Navbar.jsx · BottomNav.jsx · Footer.jsx
    ├── SearchBar.jsx        # autosuggest dropdown
    ├── SearchProductCard.jsx · PriceComparisonTable.jsx
    ├── PriceHistoryChart.jsx · ProductCard.jsx
    ├── StatsCard.jsx · LoadingSpinner.jsx
```

---

## Environment variables

Three templates ship with the repo — copy the one you want to a real
`.env*` file (gitignored):

| Template | Vite mode | Use for |
|---|---|---|
| [.env.example](.env.example) | dev (default) | `npm run dev`; leave `VITE_API_URL` blank to use the Vite proxy |
| [.env.staging.example](.env.staging.example) | `staging` | `npm run build -- --mode staging`; points at staging API |
| [.env.production.example](.env.production.example) | `production` | `npm run build` (production is Vite's default for `build`); points at prod API |

| Var | When to set |
|---|---|
| `VITE_API_URL` | Backend lives on a different origin. Leave blank for dev (Vite proxy) or same-origin prod (reverse proxy). |
| `VITE_ENV_LABEL` | Optional. Visible in the UI / analytics tags so you can tell environments apart. |

Build for a specific environment:

```bash
npm run build                         # production (default)
npm run build -- --mode staging       # staging
npm run dev                           # dev with Vite proxy
```

`.gitignore` excludes every `.env*` file except the `.env*.example`
templates, so secrets stay local.

---

## Backend contract

The axios client in [src/api/api.js](src/api/api.js) is the single place that
talks to the backend. Endpoints it consumes:

- `GET /api/search?q=...` — DB-first search, returns grouped products
- `GET /api/search/suggest?q=&limit=` — autocomplete dropdown
- `GET /api/products`, `/api/products/:idOrSlug`, `/api/products/:idOrSlug/history`
- `GET /api/compare?ids=A,B,C`
- `GET /api/sellers`, `/api/sellers/:id`
- `GET /api/dashboard/stats` — used by Dashboard
- `POST /api/admin/index/run?wipe=true` · `GET /api/admin/index/status` · `GET /api/admin/shops`
- `POST /api/scrape` — legacy "quick scrape" button (now triggers a full reindex)

See the [backend README](https://github.com/DolfinMind/dam-kemon-backend)
for the full surface.

---

## Scripts

```bash
npm run dev       # vite dev server (HMR, :5173)
npm run build     # production bundle → dist/
npm run preview   # serve dist/ locally
npm run lint      # eslint .
```

---

## Roadmap

What's left on the frontend side. Backend roadmap with the full picture
lives in the [backend README](https://github.com/DolfinMind/dam-kemon-backend#roadmap).

### Phase 2 — live signals on the public site

| | Item |
|---|---|
| ⬜ | Live "X searching now" pill on Home (polls `/api/stats/live` every 5s) |
| ⬜ | Trending searches strip — top 10 queries with high CTR in the last 24h |
| ⬜ | "Hot drops" rail — products with the biggest price drop in last 7 days |
| ⬜ | "Recently viewed" rail for returning visitors (localStorage anon-id) |
| ⬜ | Anonymous event beacons (`search`, `view`, `click` → backend events collection) |

### Phase 3 — admin console (separate `/admin` SPA)

| | Item |
|---|---|
| ⬜ | Sign-in screen exchanging `X-Admin-Key` for a session cookie |
| ⬜ | Indexer dashboard: live progress (SSE), per-shop status grid, wipe/reindex buttons |
| ⬜ | Shop manager — CRUD on the catalog without redeploying |
| ⬜ | Catalog browser — paginated grid, click → edit (rename, fix category, merge duplicates) |
| ⬜ | Search log — last 1k queries with `totalResults`, clickable to re-run |
| ⬜ | Cache + scheduler controls (flush, enable/disable jobs) |
| ⬜ | Live counters: DAU, MAU, searches/day, CTR per shop, no-result search leaderboard |

### Phase 4 — user accounts

| | Item |
|---|---|
| ⬜ | Sign-up / sign-in (Google + email magic link) |
| ⬜ | Saved searches — notify when results change |
| ⬜ | Price-drop alerts (email or Telegram) |
| ⬜ | Wishlist (per-user, cloud-synced) |

### Phase 5 — SEO + performance

| | Item |
|---|---|
| ⬜ | Server-render (or SSG via `vite-plugin-ssr`) product detail pages so Google indexes them |
| ⬜ | Generate `/sitemap.xml` of our own catalog |
| ⬜ | Open Graph image generator per product (so shared links preview right) |
| ⬜ | Schema.org `Product` JSON-LD on our pages |
| ⬜ | Code-split the bundle (current 700KB JS is fine for dev, not for first paint) |
| ⬜ | Image CDN / on-the-fly resize for product images |

### UI / UX polish backlog

| | Item |
|---|---|
| ⬜ | Compare page wired to the new product-centric model (drag products from search into Compare) |
| ⬜ | Empty-state illustrations (Sellers page, "no results" search) |
| ⬜ | Dark mode toggle |
| ⬜ | Mobile bottom-sheet for "All sellers" instead of horizontal scroll |
| ⬜ | Skeleton loaders that match the new card shape |
| ⬜ | Locale toggle (English / বাংলা) |

---

## See also

- [Backend repo](https://github.com/DolfinMind/dam-kemon-backend) — Spring Boot service that powers `/api/*`
