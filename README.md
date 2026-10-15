# Vokter — Verified Urban Tech Commerce

Vokter is a full-stack e-commerce platform for urban tech, accessories and home goods. Instead of
being a generic multi-category store, Vokter is built around three differentiators: **verified
product authenticity** on every item, an **AI shopping assistant** grounded strictly in the real
catalog, and **drops with waitlists** for limited releases.

## Live


|Component| Path|
|---|---|
| Store | <https://nova-web-vokter.vercel.app> |
| API | <https://nova-api-kappa.vercel.app/api/health> |
| Android app | `/download` on the store, or the APK link from EAS |

The browser only ever talks to the store's domain: Next.js proxies `/api/*` to the API behind the
scenes. See [Deploying](#deploying) for why.

## What makes Vokter different

- **Curated urban tech catalog** with its own visual identity, not a generic multi-category dump.
- **Verified authenticity.** Every product carries a unique, verifiable code (`VKT-…`) that customers
  can validate on the web or by scanning its QR with the app.
- **Grounded AI assistant.** It answers only with real products, prices and stock — never invents
  an item that isn't in the catalog.
- **Drop calendar** with countdowns, waitlists and push alerts for limited releases.

## Features

**Web** (`apps/web`, Next.js)
- Home with live/upcoming drop, categories with product counts, new arrivals and AI entry point
- Catalog with category and price filters, text search, sorting and pagination
- Product page with gallery, stock status, authenticity certificate (code + scannable QR), reviews
  and related products
- Conversational AI assistant (Gemini function calling) that never invents products, prices or stock
- Drop calendar with countdowns and waitlist sign-up
- Cart, checkout and order history with order progress
- Admin panel: products, drops and orders
- JWT authentication (register/login) shared with the mobile app
- App download page with a direct APK link and a QR code

**Backend** (`apps/backend`, Express + PostgreSQL)
- Modules: auth, products, categories, orders, reviews, drops, authenticity, notifications, AI search
- Short-lived JWT access tokens + rotating refresh tokens (httpOnly cookie on web, body on mobile)
- Role-based admin routes and Zod validation on every endpoint
- Authenticity validation with an audit log of every check, plus a printable QR per code
- Push notifications to a drop's waitlist when it goes live (Expo push, idempotent per drop)
- AI assistant: the model only translates the message into filters; results always come from PostgreSQL,
  with automatic filter relaxation when the model picks a category that returns nothing
- Runs as one Express app both locally (`src/server.js`) and as a Vercel Function (`api/index.js`)

**Mobile** (`apps/mobile`, Expo + Expo Router)
- Catalog with search, category filters and pagination; product detail with gallery
- Cart, checkout and order history
- Login and register with the same JWT auth as the web
- QR scanner to verify a product's authenticity in person
- Drop waitlists with push notifications

## Tech stack

| Layer | Technology |
|---|---|
| Web | Next.js 16 (App Router), React 19, Tailwind CSS 4, lucide-react, self-hosted fonts (Fontsource) |
| Backend | Node.js 22, Express 5, JWT, Zod, bcryptjs, qrcode, expo-server-sdk |
| Database | PostgreSQL 16 — Docker locally, Neon (pooled, serverless) in production |
| Mobile | React Native 0.86, Expo SDK 57, Expo Router, EAS Build |
| AI | Google Gemini (`@google/genai`) with function calling |
| Monorepo | npm workspaces + Turborepo |
| Hosting | Vercel — two projects, one for the web and one for the API |

## Project structure

```
.
├── apps/
│   ├── backend/
│   │   ├── api/index.js      # Entry point on Vercel: exports the Express app
│   │   ├── public/           # Placeholder page; also Vercel's output directory
│   │   ├── vercel.json       # framework: null, no build, rewrite /(.*) → /api
│   │   ├── db/
│   │   │   ├── migrations/   # SQL schema and data, applied in order by db:migrate
│   │   │   ├── seeds/        # Demo catalog: 40 products, 6 categories, 3 drops
│   │   │   └── dump-latest.sql  # Snapshot of the team's local catalog (local use only)
│   │   ├── scripts/          # migrate.js, seed.js, make-admin.js
│   │   └── src/
│   │       ├── config/  db/  middleware/  utils/
│   │       ├── app.js        # The Express app (named + default export)
│   │       ├── server.js     # app.listen — local development only
│   │       └── modules/      # auth, products, categories, orders, reviews,
│   │                         # drops, authenticity, notifications, ai
│   ├── web/
│   │   ├── app/              # Routes: catalog, products, drops, search, cart, checkout, admin…
│   │   │   └── icon.png      # Favicon (the Vokter emblem)
│   │   ├── components/       # ProductCard, FilterBar, AuthenticityValidator, Logo…
│   │   ├── lib/              # API client, auth/cart contexts, formatters
│   │   ├── next.config.mjs   # Rewrites /api/* to the API; validates API_ORIGIN
│   │   └── public/
│   │       ├── products/     # Product photos used by the catalog
│   │       ├── vokter-mark.png  # Emblem, transparent, used in the navbar
│   │       └── vokter-logo.png  # Full lockup
│   └── mobile/
│       ├── app/              # Screens (Expo Router): index, product/[slug], carrito,
│       │                     # pedidos, escaner, drops, login, registro, cuenta, ajustes
│       ├── assets/           # App icon, favicon, splash and Android adaptive icon
│       ├── src/lib/          # api, session, auth-context, cart-context, push, authenticity
│       └── eas.json          # Build profiles (the APK comes from `preview`)
├── docker-compose.yml        # Local PostgreSQL 16 (host port 5433)
├── DEPLOY.md                 # Step-by-step production deploy
├── package.json              # npm workspaces + scripts
└── turbo.json                # Task graph, and which env vars reach each build
```

---

# Getting started

**Requirements**

| | |
|---|---|
| Node.js | 22 or newer (`node -v`) |
| npm | 10 or newer (`npm -v`) |
| Docker Desktop | running, for the database |
| For the mobile app | a physical Android phone with **Expo Go**, or Android Studio with an emulator |

Every command below is run **from the repository root** unless it says otherwise.

### 1. Install dependencies

```bash
npm install
```

One install covers the three apps — it's an npm workspaces monorepo.

### 2. Start PostgreSQL

```bash
npm run db:up
```

This starts the `nova-db` container with PostgreSQL 16, exposed on **`localhost:5433`** (user `nova`,
password `nova_dev`, database `nova`). Port 5433 and not 5432, so it doesn't collide with a
PostgreSQL you may already have installed on your machine.

### 3. Configure environment variables

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

Neither `.env` is in git. In `apps/backend/.env` you must set:

- **`JWT_ACCESS_SECRET`** — any random string of 32+ characters. Generate one with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```

- **`GEMINI_API_KEY`** — only for the AI assistant. Free key at
  [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Everything else works without it.

`DATABASE_URL` already points to port **5433** in the example; leave it as it is unless you changed
`docker-compose.yml`.

### 4. Create the schema

```bash
npm run db:migrate
```

Applies every pending file in `db/migrations/` and records it in the `schema_migrations` table, so
it is safe to run again: it only applies what's missing.

On a brand-new container Docker already ran those files on first boot, so this just registers them
and finishes. It matters later: run it after every `git pull` that brings a new migration, and
**you never need to delete the database to update the schema.**

### 5. Load the catalog

```bash
npm run db:seed
```

40 demo products, 6 categories and 3 drops. Idempotent, so running it twice doesn't duplicate
anything. Prices and stock are demo values.

If you want the **same catalog as the rest of the team**, restore the committed snapshot instead:

```bash
npm run db:restore
```

> **`db:restore` only ever touches your local container.** The script is hardcoded to
> `docker exec -i nova-db psql -U nova -d nova`, so it cannot reach a remote database — and it
> must not. `dump-latest.sql` is a `pg_dump --clean` snapshot: it runs `DROP TABLE` on all 16
> tables before recreating them. Against production that would delete every account, order and
> session. See [Changing the catalog in production](#changing-the-catalog-in-production).

The dump excludes account data (users, tokens, orders, reviews) on purpose, so it carries no
personal data and is safe to commit.

To regenerate it after changing the catalog, run this from the repository root:

```bash
docker exec nova-db pg_dump -U nova -d nova --clean --if-exists --no-owner --no-acl \
  --exclude-table-data=users --exclude-table-data=refresh_tokens --exclude-table-data=push_tokens \
  --exclude-table-data=orders --exclude-table-data=order_items --exclude-table-data=reviews \
  --exclude-table-data=authenticity_checks --exclude-table-data=ai_tool_calls --exclude-table-data=drop_waitlist \
  | findstr /v "^COMMENT ON EXTENSION" > apps/backend/db/dump-latest.sql
```

**Do not drop `--no-owner --no-acl`.** Without them the dump carries `ALTER … OWNER TO nova`, and
restoring it anywhere the owner is a different role fails with `must be able to SET ROLE "nova"`.
This has already happened once after someone regenerated the file by hand.

### 6. Run web and backend

```bash
npm run dev
```

Turborepo starts both in parallel:

- Web → <http://localhost:3000>
- API → <http://localhost:4000/api/health> (should answer `{"status":"ok"}`)

At this point you can register an account on the web and browse the catalog.

### 7. Create an admin account

Every account created from the website is a customer. Register on the web, then promote it:

```bash
npm run db:admin -- your@email.com
```

Log out and log in again so the session picks up the new role, and the **Admin** entry appears in
the menu. To create an admin from scratch instead (it asks for the password in the terminal):

```bash
npm run db:admin -- your@email.com "Your Name"
```

---

## Running the mobile app

In development the app talks to the backend on your computer, so **the backend and the web have to
be running** (`npm run dev`) and the phone has to be on the **same Wi-Fi** as the computer. A
released APK talks to production instead — see [Build the APK](#3-build-the-apk).

### 1. Open the port in the firewall

This is the step people forget, and the symptom is the app showing "Sin conexión" while the web
works fine: Windows blocks incoming connections to Node by default. In **PowerShell as
administrator**, once:

```powershell
New-NetFirewallRule -DisplayName "Vokter API 4000" -Direction Inbound -Protocol TCP -LocalPort 4000 -Action Allow -Profile Private
New-NetFirewallRule -DisplayName "Vokter Web 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private
```

Port 4000 is the API; **3000 is needed too**, because the product photos are served by Next.js, not
by the backend. Without it the catalog loads but the images come out blank.

### 2. Start the app

```bash
cd apps/mobile
npx expo start --android --clear
```

Scan the QR with Expo Go (physical phone) or press `a` to open it in the emulator.

**You don't have to configure the IP.** The app reads the address Expo is serving the bundle from
and looks for the API on that same host, so it works on an emulator and on a physical phone with
the same code. If you ever need to point it elsewhere, the **Ajustes** screen (Account → Connection)
lets you type the URL on the device, and it's remembered.

> Push notifications do **not** work in Expo Go: Expo removed remote notifications from it in
> SDK 53. Everything else does. Waitlist sign-ups are saved correctly; the alerts only arrive in the
> APK.

### 3. Build the APK

```bash
npm install -g eas-cli
cd apps/mobile
eas login
eas build -p android --profile preview
```

Three things to know before building:

- **The target URL is baked into the build.** A standalone APK has no Expo dev server, so the
  automatic detection doesn't apply. The `preview` profile in `eas.json` already points
  `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` at the production store. Both point at the *store*
  domain on purpose: the API is reached through its proxy, and the photos are served by the store
  itself, so the app depends on a single host.
- **`usesCleartextTraffic` is still enabled** in `app.json` via `expo-build-properties`. It was
  needed to reach a local backend over plain HTTP; now that everything is HTTPS it can be removed
  if you no longer test against a LAN address.
- **Push notifications need FCM V1 credentials** (a Firebase service account key uploaded to EAS).
  The CLI asks for them during the build; you can skip it and add them later with `eas credentials`.

EAS uploads what is **committed to git**, so commit before building. The app icon, splash and
Android adaptive icon also come from the commit, so icon changes need a new build.

When it finishes, take the artifact URL (`eas build:view <id>` prints it as **Application Archive
URL**) and set it as `NEXT_PUBLIC_APK_URL` — in `apps/web/.env` locally, and in the web project's
environment variables on Vercel. The `/download` page turns into a download button plus a QR
pointing at the APK.

---

# Deploying


**Three pieces:** a Neon PostgreSQL database, a Vercel project for the API (root directory
`apps/backend`), and a Vercel project for the web (root directory `apps/web`).

**Only the store has a public domain.** The browser never talks to the API's domain; it requests
`/api/…` from the store and Next forwards it (`rewrites` in `next.config.mjs`). That is not a
preference: the refresh-token cookie is `httpOnly` and `sameSite=lax`, so a browser would refuse to
send it to a different domain and **web login would break**. The proxy keeps everything same-site,
with no CORS and a single URL to remember.

**Environment variables that matter**

| Project | Variable | Note |
|---|---|---|
| Web | `API_ORIGIN` | The API's domain, with `https://`, no trailing slash |
| Web | `NEXT_PUBLIC_SITE_URL` | The store's own domain |
| Web | `NEXT_PUBLIC_APK_URL` | The EAS artifact link |
| Web | `NEXT_PUBLIC_API_URL` | **Leave it undefined.** If set, the browser bypasses the proxy and login breaks |
| API | `DATABASE_URL` | Neon's **pooled** string (the host contains `-pooler`) |
| API | `CORS_ORIGINS` | The store's domain |
| API | `JWT_ACCESS_SECRET` | 32+ random characters, different from your local one |

**Two traps worth knowing about, because both cost hours:**

- **Turborepo filters the build environment.** Since v2, strict mode is the default: a task only
  sees the variables declared in `turbo.json`. `NEXT_PUBLIC_*` gets through by framework inference,
  but anything else does not. That is why `API_ORIGIN` is listed under `tasks.build.env` — without
  it the variable exists on Vercel and `next build` still can't see it. **Any new variable that
  doesn't start with `NEXT_PUBLIC_` has to be added there too.**
- **Rewrites are resolved at build time**, not per request. If `API_ORIGIN` is missing while the
  build runs, the localhost fallback gets baked in and the deployed site answers 404 on `/api/*`
  while the pages crash when rendering. `next.config.mjs` now fails the build with a clear message
  instead of letting that ship, and logs the resolved origin so you can check it in the build log.

**The API on Vercel.** `apps/backend/api/index.js` exports the Express app, and `vercel.json`
rewrites every path to it, so Express does all the routing exactly as it does locally.
`src/server.js` (the `app.listen`) is for local development only and isn't used in production. The
`vercel.json` also sets an empty build command — without it Vercel runs the monorepo's
`turbo run build`, which produces nothing for the backend and then fails looking for a static output
directory.

## Changing the catalog in production

Do **not** point `dump-latest.sql` at Neon. It is a `--clean` dump; it would drop every table,
accounts included. Two safe ways:

1. **The admin panel on the live store.** It writes straight to Neon. This is the right choice for
   adding or editing a handful of products.
2. **A numbered migration** in `db/migrations/`, applied with `npm run db:migrate` while
   `DATABASE_URL` points at Neon. This is how `004_conjuntos_y_sneakers.sql` added 30 products: a
   plain `INSERT … ON CONFLICT DO NOTHING`, so it only adds and can be re-run safely. Use this for
   bulk loads and anything that should also reach a fresh local database.

To promote an account to admin on production, either run the script with `DATABASE_URL` pointing at
Neon, or run this in Neon's SQL Editor after registering on the web:

```sql
UPDATE users SET role = 'admin', is_active = TRUE
WHERE email = 'your@email.com'
RETURNING id, name, email, role;
```

The role travels inside the access token, so log out and back in afterwards.

---

## Available scripts (repository root)

| Script | What it does |
|---|---|
| `npm run dev` | Runs web and backend in parallel (Turborepo) |
| `npm run build` | Production build |
| `npm run lint` | Lints the web app |
| `npm run db:up` / `db:down` | Starts / stops the PostgreSQL container |
| `npm run db:migrate` | Applies pending migrations. Respects `DATABASE_URL` from the shell, so it also works against Neon |
| `npm run db:seed` | Loads the demo catalog (idempotent) |
| `npm run db:restore` | Loads `db/dump-latest.sql` into the **local** container. Never usable against production |
| `npm run db:reset` | **Deletes the volume** and recreates the database from scratch. Docker replays the migrations on first boot, so afterwards you only need `db:seed` |
| `npm run db:admin -- email` | Gives the admin role to an account (or creates it) |
| `npm run mobile` | Shortcut for `expo start --android` in `apps/mobile` |

## Technical decisions

- **Relational model instead of arrays.** Order items, drop products and waitlists are join tables
  with foreign keys, so data stays consistent and queries per user are indexed.
- **Money as integers.** Prices are stored as integer pesos (`price_cents`), never floats, and are
  frozen in `order_items` at purchase time. The order total is always recalculated by the backend
  inside a transaction, so a stale price in a client's cart can never be charged.
- **Authenticity.** Product codes (`VKT-…`) live on each product; the schema also supports per-unit
  codes (`VKU-…`) for physical QR labels. Every validation is logged in `authenticity_checks`,
  including the ones that fail — that's how cloned codes get spotted.
- **Grounded AI.** Gemini only returns structured filters (text, category, price range) through
  function calling. Categories come from the database, and products, prices and stock always come
  from PostgreSQL, so the assistant cannot hallucinate items.
- **Auth for web and mobile.** 15-minute access JWT plus rotating refresh tokens stored hashed.
  Reusing an already-rotated refresh token revokes every session of that user. On mobile the tokens
  live in `expo-secure-store` and a 401 transparently refreshes and retries the request.
- **Push that doesn't duplicate.** Announcing a drop is claimed atomically through
  `drops.announced_at`, so restarting the server or re-marking it live never notifies twice; if the
  send fails entirely, the mark is released so it can be retried.
- **Versioned migrations.** `schema_migrations` records what has been applied, so the schema evolves
  without recreating the database — and the same files bring a fresh local database and production
  to the same state.
- **One Express app, two runtimes.** The app is defined once in `src/app.js`. Locally `server.js`
  listens on a port; on Vercel `api/index.js` hands the same app to the platform. No branching on
  the environment, so what you test locally is what runs in production.
- **Serverless-aware pool.** In production the connection pool is capped at one connection per
  function instance and the real pooling is Neon's (`-pooler` endpoint). The startup DB check is
  non-blocking, so a database hiccup degrades individual requests instead of killing the function.
- **Always-fresh pages.** Catalog, drops and stock pages render on every request, so they never show
  stale prices or stock.

## Troubleshooting

**Database**

- **`password authentication failed`** — locally, `DATABASE_URL` must use port `5433`, not `5432`.
  If you have PostgreSQL installed natively, that's what's answering on 5432. On Neon, check you
  copied the **pooled** string.
- **`unable to get image 'postgres:16'`** — Docker Desktop isn't running, or its engine hasn't
  started yet.
- **The catalog is empty** — you skipped `npm run db:seed` (or `db:restore`).
- **A column or table is missing after a `git pull`** — run `npm run db:migrate`.
- **`must be able to SET ROLE "nova"`** — the dump was regenerated without `--no-owner --no-acl`.
- **`no schema has been selected to create in` (3F000)** — the role's default `search_path` is
  empty. `db:migrate` sets it on first run; re-run it against that database.

**Web**

- **"No se pudo conectar con la API de Vokter"** — the backend isn't running, or the port in
  `NEXT_PUBLIC_API_URL` doesn't match.
- **The AI assistant returns an error** — the free Gemini key has a low daily quota per model. Wait
  for the reset or use a key with more quota. It's not a bug in the code.
- **The admin panel redirects to the home page** — the account isn't an admin yet, or the session
  predates the role change: log out and log in again.

**Deployment (Vercel)**

- **The build fails with `Falta API_ORIGIN`** — the variable isn't reaching `next build`. Check it
  exists, is marked for Production, and is listed in `turbo.json` under `tasks.build.env`.
- **`No Output Directory named "public" found`** on the API project — Vercel is treating it as a
  static site. Root Directory must be `apps/backend`, and Build Command and Output Directory must be
  left empty in Settings so `vercel.json` governs.
- **`/api/health` works but `/api/auth/login` 404s** — a Vercel 404, not an Express one: the request
  never reached the app. Check `vercel.json` still has the catch-all rewrite to `/api`.
- **Pages crash with React error #441** — a Server Component failed to render, usually because the
  server-side fetch couldn't reach the API. Check `API_ORIGIN` and the Runtime Logs.
- **The site redirects to `vercel.com/login`** — Deployment Protection is on. Set it to *None* in
  Settings → Deployment Protection. *Standard Protection* is not enough while the site is served
  from a generated `*.vercel.app` URL.
- **The first request after a while is slow** — Neon suspends an idle database and Vercel cools the
  function. Normal on the free plans.

**Mobile**

- **"Sin conexión" while the web works** — in development, the firewall rule for port 4000 is
  missing (see above), or the phone is on a different network than the computer.
- **The catalog loads but the photos are blank** — in development, the web isn't running or port
  3000 is blocked; Next.js serves the images, not the backend.
- **Push notifications never arrive** — expected in Expo Go; they need the APK with FCM credentials.
- **`eas` is not recognized as a command** — the npm global folder isn't in your PATH. Open a new
  terminal, or use `npx eas-cli@latest …` instead.

## Authors

- **Alejandro Mier** — [github.com/Cachureto](https://github.com/Cachureto)
- **Felipe Villaquiran** — [github.com/pipeeex](https://github.com/pipeeex)
- **Gabriel Badillo** — [github.com/gabrielbadillo123](https://github.com/gabrielbadillo123)

## License

This project was developed for evaluation purposes as part of a technical assessment.
