# dam-kemon-frontend

> **Damkemon** is a Bangladesh price comparison engine. Search any product → we scan
> 10+ Bangladeshi e-commerce sites plus Facebook sellers and surface the cheapest.
>
> This repo is the **frontend** — Vite + React 18. The companion backend lives at
> [Saif64/dam-kemon-backend](https://github.com/Saif64/dam-kemon-backend).

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
- The [backend](https://github.com/Saif64/dam-kemon-backend) running on `http://localhost:8080` (the Vite dev server proxies `/api` to it)

### 1. Install

```bash
npm install
```

### 2. Configure (optional)

```bash
cp .env.example .env
```

Defaults work out of the box for local dev — `VITE_API_URL` left blank means axios hits `/api` and Vite proxies to `localhost:8080`. Override only when the backend is on a different origin:

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
| `/` | [Home.jsx](src/pages/Home.jsx) | Hero, category grid, deals, F-commerce promo, how-it-works |
| `/search?q=...` | [SearchResults.jsx](src/pages/SearchResults.jsx) | Product-first list with detected-category chip |
| `/product/:id` | [ProductDetail.jsx](src/pages/ProductDetail.jsx) | Tabs: prices, history, reviews |
| `/compare?ids=A,B,C` | [Compare.jsx](src/pages/Compare.jsx) | 4-up grid + spec table, winner crown per row |
| `/sellers` | [Sellers.jsx](src/pages/Sellers.jsx) | Facebook seller directory |
| `/dashboard` | [Dashboard.jsx](src/pages/Dashboard.jsx) | Aggregate stats, charts, scraper status |

---

## Layout

```
src/
├── api/api.js               # axios client, VITE_API_URL aware
├── App.jsx                  # router + layout shell
├── main.jsx                 # Vite entry
├── index.css                # Tailwind directives + globals
├── assets/
├── pages/                   # one file per route (above)
└── components/
    ├── Navbar.jsx · BottomNav.jsx · Footer.jsx
    ├── SearchBar.jsx · SearchProductCard.jsx · ProductCard.jsx
    ├── PriceComparisonTable.jsx · PriceHistoryChart.jsx
    ├── ReviewCard.jsx · StatsCard.jsx · LoadingSpinner.jsx
```

---

## Environment variables

Only one, and it's optional. See [.env.example](.env.example).

| Var | When to set |
|---|---|
| `VITE_API_URL` | Backend lives on a different origin in prod. Leave blank for dev (Vite proxy) or same-origin prod (reverse proxy). |

---

## Backend contract

The axios client in [src/api/api.js](src/api/api.js) is the single place that talks to the backend. Endpoints it consumes:

- `GET /api/search?q=&page=&size=` — search
- `GET /api/products`, `/api/products/:id`, `/api/products/:id/history`, `/api/products/:id/reviews`
- `GET /api/compare?ids=A,B,C`
- `GET /api/sellers`, `/api/sellers/:id`
- `GET /api/sites`, `/api/dashboard/stats`
- `POST /api/scrape`

See the [backend README](https://github.com/Saif64/dam-kemon-backend) for the full surface.

---

## Scripts

```bash
npm run dev       # vite dev server (HMR, :5173)
npm run build     # production bundle → dist/
npm run preview   # serve dist/ locally
npm run lint      # eslint .
```

---

## See also

- [Backend repo](https://github.com/Saif64/dam-kemon-backend) — Spring Boot service that powers `/api/*`
