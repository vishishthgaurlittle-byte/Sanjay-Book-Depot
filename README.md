# Sanjay Book Depot

Premium Indian stationery e-commerce platform.

## Architecture

| Concern | Service | Why |
|---|---|---|
| **Database** | Turso (libSQL/SQLite), `sanjay-axuile` in `aws-ap-south-1` | 5 GB free tier vs Insforge's 500 MB. Real foreign-key enforcement, generated columns, CHECK constraints, FTS5 search. |
| **Auth** | Insforge | Email/password + OAuth, session tokens, email verification. |
| **File storage** | Insforge storage (admin uploads) + Next.js `/public` (generated art) | Insforge free gives 1 GB storage / 5 GB bandwidth. Generated placeholder art is served from Vercel's CDN so it never consumes that allowance. |

```
sanjay-book-depot/
├── backend/    Node scripts: Turso migrations, seeding, verification
└── frontend/   Next.js 16 app: storefront, API routes, 3D
```

### Why the API layer is hand-written

Insforge auto-generates a PostgREST API for its own Postgres tables. Turso does
not, so every endpoint lives in `frontend/src/app/api/**` as a Next.js route
handler. That is the main cost of moving the database off Insforge.

### Security model

Both credentials are **server-side only**. Neither appears in a `NEXT_PUBLIC_`
variable and neither is imported by a client component.

- Browser → `/api/*` route handlers → Turso (token stays on the server)
- Browser → `/api/auth/*` proxy → Insforge, forwarding **the visitor's own
  session token**, never `INF_API_KEY`

The auth proxy is allowlisted: `/api/auth/tables` returns `403`, so it cannot be
used as an open proxy into the Insforge admin API.

## Theme system

Ten luxury palettes, switchable by an administrator only, applied site-wide.

| Id | Mode | Best for |
|---|---|---|
| `obsidian-gold` | dark | Fountain pens, executive diaries, gift sets |
| `midnight-sapphire` | dark | Corporate planners, office, leather goods |
| `emerald-prestige` | dark | Vintage stationery, wax seals, art supplies |
| `the-architect` | dark | Geometry boxes, mechanical pencils, drafting |
| `vanta-neon` | dark | Gel pens, markers, tech accessories |
| `heritage-paper` | light | Watercolour paper, sketchbooks, craft |
| `royal-rajputana` | light | Festive hampers, traditional art materials |
| `muji-minimalist` | light | Everyday essentials, notebooks |
| `the-calligrapher` | light | Fountain pens, ink, journals |
| `marble-rose` | light | Aesthetic planners, sticky notes, brush pens |

**How it works.** A theme is five core colours (`bg`, `surface`, `text`,
`muted`, `accent`, plus an optional `accent2`). `lib/themes.ts` expands those
into the full design-token ramp — the `ink-950…ink-50` scale and the
`saffron-*` accent ramp — by mixing, so a theme is defined once and stays
internally consistent.

The `ink` ramp always runs from page background to primary text, which is what
lets the same components serve both dark and light palettes. `--theme-mode` is
also emitted so `color-scheme` flips form controls and scrollbars.

The database stores **only the active theme id** (`site_settings.active_theme`).
Definitions live in code because they are design tokens, not content — an admin
switch is one row update, and `app/layout.tsx` injects the resulting CSS
variables on the next server render. No rebuild, no client-side flash.

Because Tailwind 4 utilities compile to `var(--color-*)`, overriding the token
names re-skins every component without editing a single one.

**Authorization.** `PUT /api/admin/theme` calls `requireAdmin()`, which performs
two independent checks: Insforge must confirm the bearer token maps to a real
session, *and* that account's email must exist in Turso's `admin_users` with
`is_active = 1`. Registering on the public site does not create that row, so a
customer token is rejected with 403. Enforcement lives in the API route, not the
UI — the `/admin/settings` page can be opened by anyone, but only previews.

`GET /api/admin/theme` is public; it contains no secrets, only the palette list.

## Setup

```bash
# 1. database
cd backend && npm install
cp .env.example .env        # fill in TURSO_* and INF_*
npm run migrate             # 12 tables, indexes, triggers, FTS5
npm run seed                # 52 brands, 65 categories, 500 products
npm run verify              # 31 assertions, exits non-zero on failure

# 2. storefront
cd ../frontend && npm install
cp .env.example .env.local  # fill in TURSO_* and INF_*
npm run placeholders        # generates /public/images/products/*.svg
npm run dev
```

## Scripts

| Command | Where | What |
|---|---|---|
| `npm run migrate` | backend | Applies pending migrations in a transaction; `--reset` drops everything first |
| `npm run seed` | backend | Idempotent upserts — safe to re-run |
| `npm run verify` | backend | Exercises real query paths, not just row counts |
| `npm run placeholders` | frontend | Regenerates product artwork from the SKUs in Turso |
| `npm run typecheck` | frontend | `tsc --noEmit` |
| `npm run build` | frontend | Production build |

## Scaling the catalogue

The generator is deterministic (seeded PRNG), so the same seed always produces
the same SKUs and prices. To grow past the Phase-1 500 products:

```bash
SEED_MULTIPLIER=3 npm run seed   # 1500 products
SEED_MULTIPLIER=6 npm run seed   # 3000 products
```

## Notes and trade-offs

- **Money is stored as REAL.** SQLite has no `numeric` type and Insforge rejects
  `numeric` outright (HTTP 500). Totals are computed in paise via
  `totalFromLines()` in `src/lib/format.ts` — never sum raw float prices.
- **`customers.auth_user_id` has no foreign key.** The user lives in Insforge's
  Postgres, a different database, so that relationship is enforced in
  application code.
- **3D models are procedural.** Every product renders from R3F primitives chosen
  by category. Set `products.model_3d_url` to a GLB and the viewer will load it
  instead — no code change needed.
- **The seeded catalogue is generated placeholder data**, not real stock. The
  demo customer has a placeholder `auth_user_id` with no Insforge user behind it.

## Known blocker: Insforge login is currently impossible

Verified against the live instance on 2026-09-02. **No account can log in**,
which blocks checkout, orders, and the admin theme switch.

The instance has `requireEmailVerification: true` (from `GET /api/auth/config`)
but **no SMTP is configured**, so verification emails are never delivered.
`POST /api/auth/email/send-otp` returns `202` — the code is generated and goes
nowhere, and it is not returned in the response, so it cannot be read.

Consequences found by direct probing:

- `POST /api/auth/sessions` → `403 FORBIDDEN: Email verification required`
- `POST /api/auth/users` → `401 AUTH_INVALID_CREDENTIALS: No token provided`
  without the service key. It is an **admin-side** endpoint, so public
  self-registration cannot work from the browser, which must never see the key.
- `PATCH /api/auth/config`, `PATCH /api/auth/users/{id}`,
  `POST /api/auth/users/{id}/verify` → all **404**. There is no API route to
  flip the setting or mark an account verified.
- The service key is **not** accepted as a session bearer
  (`GET /api/auth/sessions/current` with it → 401), so it cannot stand in for a
  user token.

**Fix (dashboard, not code):** either turn off *Require email verification* in
the Insforge project settings, or configure SMTP. Then register the owner
account and insert its email into `admin_users`.

Two follow-ups once login works:

1. Registration must move to a **server route** that adds the service key —
   the current `/register` page posts through the auth proxy with no token and
   will always 401.
2. `requireAdmin()` is written and its database half is verified (owner email →
   ALLOW, demo customer → DENY, unknown → DENY), but the accept path has not
   been exercised end to end because no session token can be minted yet.

## Design system

Every page is built from a small set of primitives defined as Tailwind 4
`@utility` rules in `app/globals.css`:

| Utility | Use |
|---|---|
| `.display` | Cormorant Garamond display type — headings, prices, large numerals |
| `.eyebrow` | Small letterspaced accent label above a heading |
| `.lux-btn` / `.lux-btn-ghost` | Solid and hairline-outline actions |
| `.lux-card` | Hairline-bordered surface with a 4px radius |
| `.lux-link` | Quiet uppercase text link |

Two rules keep all ten palettes legible:

1. **Never hardcode a colour.** `text-white` is invisible on the five light
   themes, so primary text is always `text-ink-50` and surfaces use
   `color-mix()` against the theme's own text colour.
2. **Borders use `color-mix`, not a fixed ramp step.** A literal
   `border-ink-800` is near-invisible on `muji-minimalist`; mixing 10% of the
   theme's text colour stays visible on both ends.

Typography is Cormorant Garamond (display) + Inter (UI), both self-hosted by
`next/font` so there is no external request and no FOUT.

### Routes that do not exist yet

`/checkout` and `/account` are linked but not built. Login and register
currently redirect to `/` rather than `/account` so a signed-in customer is not
dropped on a 404 — search for `TODO: point at /account` to find both spots.
The cart's "Proceed to checkout" button still targets `/checkout`.

## Admin panel

Two pages, both behind `requireAdmin()`:

| Page | Purpose |
|---|---|
| `/admin/settings` | Switch the storefront theme (10 palettes) |
| `/admin/products` | Search, delete, and feature products |

**Endpoints**

- `GET /api/admin/products` — paginated list, `?q=` searches name/SKU/brand
- `DELETE /api/admin/products/:id` — hard delete; images, variants and reviews
  cascade, `order_items.product_id` is set NULL so order history survives, and
  the FTS index is cleaned by trigger. The handler re-reads the row afterwards
  and returns 500 if it is somehow still there.
- `PATCH /api/admin/products/:id` — toggles `is_featured` / `is_bestseller` /
  `is_active`. `is_featured` drives the homepage "Featured this season" grid.
- `GET/PUT /api/admin/theme` — read palette list / switch active theme

**Authentication — two accepted credentials**

1. An Insforge session token whose email is in `admin_users` (`is_active = 1`).
2. `ADMIN_TOKEN`, a shared secret in `frontend/.env.local`, pasted into the
   token field on the admin page and kept in `localStorage`.

Path 2 exists because the Insforge project still has
`requireEmailVerification: true` with no SMTP configured, so **no account can
obtain a session** and path 1 is currently unreachable. Once you disable email
verification (or configure SMTP) in the Insforge dashboard, path 1 works and
you can delete `ADMIN_TOKEN` to close path 2. Until then, treat that token as
a password — it grants full catalogue control.

## Catalogue size

`SEED_MULTIPLIER=5 npm run seed` → **2,500 products**, 7,500 image rows.
Change the multiplier to scale (`=4` → 2,000, `=10` → 5,000); the total is
exact at every value.

**Distribution is weighted, not flat.** `CATEGORY_WEIGHTS` in
`src/lib/data/catalog.mjs` gives each parent category a share of the catalogue
(18% writing instruments, 16% notebooks, down to 1% school kits), matching
`PRODUCT-ALLOCATION-PLAN.xlsx`. Within a category, brands are picked with
`TIER_WEIGHT` (tier1 3.0 / tier2 1.5 / tier3 0.8), so major manufacturers get a
wider range than boutiques — verified averages are 82 / 36 / 11 products per
brand. Because weighted draws are probabilistic and could skip a small brand
entirely, each subcategory first force-assigns one product to every brand that
has not appeared yet, guaranteeing all 52 brands are stocked.

Re-seeding with a *different* multiplier than the last run leaves stale rows
behind, because SKU numbering shifts. Wipe first:

```sql
DELETE FROM products;   -- cascades images, variants and reviews
```

then re-seed.

## Product images

`product_images` rows point at `/images/products/{SKU}-{n}.svg`. Only the first
batch of placeholder art exists on disk, so `resolveImage()` in
`src/lib/queries.ts` substitutes `/images/products/_fallback.svg` for any file
that is not actually present — one cached `readdir`, no broken `<img>` tags.
Real photographs go to the Insforge `products` bucket
(`PUT /api/storage/buckets/products/objects/{key}`, multipart `file` field,
public read via CDN); any URL not under `/images/products/` is passed through
untouched, so switching a product to a real photo is just a URL change.
