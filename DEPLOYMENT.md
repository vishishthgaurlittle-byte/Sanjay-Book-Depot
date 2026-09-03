# Deployment Guide — Sanjay Book Depot

The Next.js app lives in **`frontend/`** (`package.json`, `src/`, `next.config.ts`).
The `backend/` folder holds Turso migration/seed scripts and is **not** deployed.

## Deploy on Vercel

1. **Import** — vercel.com/new → select the repo `vishishthgaurlittle-byte/Sanjay-Book-Depot`.
2. **Root Directory: set it to `frontend`** (Settings → General → Root Directory).
   This is required — the app is in a subfolder, so Vercel must build from `frontend/`.
   Framework then auto-detects as **Next.js** (build `next build`, output `.next`).
3. **Environment Variables** — add these *before* the first deploy:

   | Key | Notes |
   |---|---|
   | `TURSO_URL` | libSQL database URL |
   | `TURSO_TOKEN` | libSQL auth token |
   | `INF_BASE_URL` | Insforge project URL |
   | `INF_API_KEY` | Insforge service key |
   | `ADMIN_TOKEN` | admin-panel bearer token |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | optional — enables Google sign-in |
   | `GOOGLE_CLIENT_ID` | optional — server-side Google verify |

   Values live in `.env.local` (gitignored — never committed). See `.env.example` for the keys.
4. **Deploy.**

## After deploy

| Area | URL |
|---|---|
| Storefront | `https://<your-app>.vercel.app` |
| Admin login | `/admin/login` (enter `ADMIN_TOKEN`) |
| Admin · Products | `/admin/products` |
| Admin · Khata (ledger) | `/admin/khata` |
| Admin · Appearance | `/admin/settings` |
| Sitemap | `/sitemap.xml` (regenerate: add `export const revalidate` to `src/app/sitemap.ts`) |

## Local development

```bash
cd frontend
npm install
npm run dev          # http://localhost:3000  (needs frontend/.env.local)
```

## Database (Turso) — one-time / schema changes

```bash
cd backend
npm install
npm run migrate      # apply pending migrations (idempotent)
npm run seed         # optional: seed catalogue
```

## Google Sign-In (admin)

1. Create an OAuth client (Web application) at console.cloud.google.com → APIs & Credentials.
   Add your deployed origin to *Authorized JavaScript origins*.
2. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` to that client id.
3. Add your Google email to the `admin_users` table (`is_active = 1`).

## Troubleshooting

- **404 NOT_FOUND on every route** → Root Directory is not set to `frontend`. Vercel built from
  the repo root, which has no `package.json`, so it produced no routes.
- **"No Next.js version detected"** → same cause: set Root Directory to `frontend` so Vercel
  finds `frontend/package.json` (which has `next`).
- **Homepage 500s after deploy** → `TURSO_URL` / `TURSO_TOKEN` missing. Add them and redeploy.
