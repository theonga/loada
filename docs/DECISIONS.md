# Architectural Decision Log

Decisions that aren't obvious from reading the code. Each entry records what was decided,
why, and what alternatives were rejected.

---

## 2026-05-22 — Prisma schema and seed moved to `apps/api/prisma/`

**Decision:** Prisma schema (`schema.prisma`) and seed (`seed.ts`) live in
`apps/api/prisma/`, not at the monorepo root `prisma/`.

**Why:** Only one service (the API) uses Prisma. Keeping schema at the root required
`--schema ../../prisma/schema.prisma` flags on every Prisma CLI call and a `"prisma"`
override in `package.json`. Moving it to `apps/api/prisma/` uses Prisma's default
discovery (schema at `./prisma/schema.prisma` relative to `package.json`) and removes
all override flags.

**Trade-off rejected:** If a second service ever needs the same schema (e.g., a separate
analytics worker), it can be moved back to the root or consumed as a published package.
For single-service MVP, co-location wins.

**CLAUDE.md impact:** The monorepo structure diagram now shows `apps/api/prisma/` for
schema and seed.

---

## 2026-05-22 — `tsconfig.seed.json` for seed compilation

**Decision:** Added a separate `tsconfig.seed.json` that extends the main tsconfig
but sets `rootDir: .` (instead of `./src`).

**Why:** The main `tsconfig.json` sets `rootDir: ./src`, which prevents TypeScript from
compiling files outside `src/`. The seed lives in `prisma/seed.ts`. Rather than relaxing
`rootDir` for the whole project, a separate tsconfig scope-limits the relaxation to seed
compilation only. `db:seed` uses `--project tsconfig.seed.json`.

---

## 2026-05-22 — `PATCH /jobs/:jobId/status` endpoint added

**Decision:** Added a driver-only status-transition endpoint for the delivery pipeline.

**Why:** `confirmPickup` requires job status `PICKUP_ARRIVED` and `confirmDelivery`
requires `IN_TRANSIT`. The original 12-step spec had no explicit route for the
intermediate transitions: `MATCHED → PICKUP_EN_ROUTE → PICKUP_ARRIVED → IN_TRANSIT`.
These map to mobile UI buttons ("Start heading to pickup", "I've arrived", "Start delivery").

**Allowed transitions via this endpoint:**
- `MATCHED → PICKUP_EN_ROUTE`
- `PICKUP_EN_ROUTE → PICKUP_ARRIVED`
- `LOADED → IN_TRANSIT`

**Transitions handled by other endpoints:**
- `PICKUP_ARRIVED → LOADED` — via `POST /deliveries/:id/pickup`
- `IN_TRANSIT → DELIVERED` — via `POST /deliveries/:id/confirm`
- `POSTED/BIDDING → CANCELLED` — via `PATCH /jobs/:id/cancel`
- `BIDDING → MATCHED` — via `PATCH /bids/:id/accept`

**Security:** Route is guarded by `requireDriver` and checks `job.matchedDriverId === req.driverProfile.id`.

---

## 2026-05-22 — Prisma v5.22 instead of v7

**Decision:** Pinned `@prisma/client` and `prisma` at `^5.22.0`.

**Why:** Prisma v7 was installed by default and introduced breaking changes:
- `url` property in the `datasource` block was removed in v7's new datasource API
- Inline enum syntax (e.g., `enum Foo { A B C }` on one line) was rejected
- Client initialization model changed

Prisma v5.22 is the latest stable v5, fully supports PostgreSQL + PostGIS extensions via
`previewFeatures = ["postgresqlExtensions"]`, and is production-ready.

**Migration path:** When upgrading to v6/v7, follow the official major-version upgrade
guide at https://pris.ly/d/major-version-upgrade.

---

## 2026-05-22 — Redis `maxRetriesPerRequest: null` required for BullMQ

**Decision:** The `ioredis` client used by BullMQ must be initialized with
`maxRetriesPerRequest: null`.

**Why:** BullMQ uses blocking Redis commands (`BLPOP`, `BRPOPLPUSH`) for queue polling.
The ioredis default `maxRetriesPerRequest: 3` causes BullMQ to throw:
`"maxRetriesPerRequest must be null"` because retry limits conflict with indefinite blocking.

**File:** `apps/api/src/lib/redis.ts`

---

## 2026-05-22 — Refresh token strategy: body params, not cookies only

**Decision:** `POST /auth/refresh` accepts `{ userId, refreshToken }` in the request body.

**Why:** React Native apps cannot reliably use `httpOnly` cookies because the WebView
and fetch behavior around cookie jar management varies by platform. Mobile clients store
the refresh token in secure storage (AsyncStorage, Keychain) and send it in the body.
The server also sets `httpOnly` cookies as a belt-and-suspenders measure for web clients.

---

## 2026-05-22 — Notifications: FCM-only, no persistent DB inbox for MVP

**Decision:** `GET /notifications` returns `[]`. No `Notification` model in the schema.

**Why:** Push notifications are fire-and-forget via FCM. A persistent inbox requires a
`Notification` model, read/unread state, pagination, and a real-time counter badge —
complexity that isn't needed to ship the MVP. All notification events (match confirmed,
delivery completed, subscription expiring) are sent to the device via FCM and optionally
via BulkIT SMS.

**When to revisit:** When an in-app notification centre UI (Screen 26) is built. At that
point, add a `Notification` model to the schema and populate it from the `notification`
BullMQ worker alongside the FCM dispatch.

---

## 2026-05-22 — Market reference: PostGIS + Redis cache + distance fallback

**Decision:** Market reference price uses a three-layer strategy:
1. Redis cache (`loada:market:<routeHash>:<tonnes>`, 1-hour TTL) — fastest path
2. PostGIS `ST_Distance` query over historical completed jobs — median with percentile
3. Distance × per-km rate table — fallback when fewer than 5 historical jobs exist

**Why:** Google Maps Distance Matrix is billed per call. The PostGIS query is free and
uses data we already have. The distance fallback ensures the widget always shows
*something* useful even on a fresh database with no history.

**Index required:** `CREATE INDEX ON "Job" ("status", "requiredTonnes")` to make the
PostGIS query fast on large datasets. Add this index when running on production RDS.

---

## 2026-05-22 — Driver location: Redis GEOADD only, never PostgreSQL

**Decision:** Live driver locations are stored exclusively in Redis via `GEOADD`.
The PostgreSQL `DriverProfile` table has `lastLocationLat`, `lastLocationLng`,
`lastLocationAt` fields but these are only updated on `PATCH /drivers/me/online` —
they are *not* used for proximity matching. Proximity matching always reads from Redis.

**Why:** GPS updates arrive every few seconds per driver. Writing to PostgreSQL on every
update would be expensive and unnecessary — the DB would become a write bottleneck.
Redis `GEORADIUS` handles proximity queries in O(N+log(M)) with no schema.

**TTL:** Each driver's geo key expires after 30 seconds without an update. The mobile
app sends a ping every 10 seconds while online to keep the key alive.

---

## 2026-05-22 — Admin panel: Next.js web app + DB-backed AppConfig

**Decision:** Admin functionality lives in a separate `apps/admin/` Next.js 14 web app.
All operational constants are stored in the `AppConfig` PostgreSQL table (not `.env` files)
and exposed for editing via the admin panel.

**Why separate web app instead of embedding in API:**
- Separation of concerns — admin UI builds and deploys independently
- No risk of admin routes affecting API performance or security surface
- Can be placed behind a separate auth layer (IP allowlist, VPN) at the NGINX level without touching the API config

**Why DB-backed config instead of env vars for operational constants:**
- Env vars require a server restart to change; AppConfig updates take effect within 60 seconds (Redis TTL)
- Operational constants (subscription prices, bid TTL, search radius) need to be tunable at runtime without a deploy
- Changes are audited (who changed what, when) via `updatedBy` and `updatedAt` fields

**22 configurable keys across 6 groups:** pricing, bidding, matching, auth, payments, market reference.

**Default credentials seeded:** username `admin`, password `changeme123` — must be changed in production.
The seed reads `ADMIN_SEED_USERNAME` and `ADMIN_SEED_PASSWORD` env vars if set.

**Alternatives rejected:**
- _Grafana/Retool_: External tools require additional infrastructure and can't be customized easily
- _API-only admin routes_: No UI is unusable for non-technical ops staff
- _Hardcoded constants_: Cannot be changed without a redeploy

---

## 2026-05-26 — `isNewUser` flag on verify-otp response

**Decision:** `POST /auth/verify-otp` now returns `isNewUser: boolean`.

**Why:** New users are created with an empty name (previously auto-generated as
`User ${phone.slice(-4)}`). The mobile client needs to know whether to route to the
name-collection screen (`/(auth)/name`) or directly to the home screen. Without this
flag, the client would have to inspect the user's name or make a second API call.

**Alternative rejected:** Checking `user.name === ""` client-side — fragile,
implementation detail of how we generate names would leak into the client.

---

## 2026-05-26 — Name collected via dedicated screen, not at registration

**Decision:** New users enter their name on a dedicated `/(auth)/name` screen after OTP
verification, before role-specific onboarding. `PATCH /auth/me` writes the name.

**Why:** The original auto-generated name (`User 1234`) was a placeholder that was never
updatable. Collecting the name inline in the OTP screen clutters that screen. A dedicated
screen matches the InDrive UX pattern and allows the name to be validated and previewed
before continuing.

**Returning users:** `isNewUser: false` → skip name screen entirely, go directly to
`/(driver)` or `/(shipper)`.

---

## 2026-05-26 — Root layout guard exempts `driver-setup` and `name` routes

**Decision:** The root `_layout.tsx` auth guard (`isAuthenticated && inAuthGroup → redirect home`)
now allows authenticated users to remain in the `(auth)` segment when they are in
`driver-setup/*` or `name` sub-routes.

**Why:** After OTP verification, `isAuthenticated` becomes `true` and the user is routed
to `/(auth)/driver-setup/documents` (new drivers) or `/(auth)/name` (all new users).
Without this exemption, the guard immediately fires and redirects them back to `/(driver)`,
making onboarding unreachable.

**Scope of change:** Only `segments[1] === 'driver-setup'` and `segments[1] === 'name'`
are exempted. All other auth-group routes (role selection, phone, OTP) correctly redirect
authenticated users home.

---

## 2026-05-26 — `PROVIDER_GOOGLE` conditional for Expo Go on Android

**Decision:** `react-native-maps` MapView uses `PROVIDER_GOOGLE` in production builds but
falls back to `PROVIDER_DEFAULT` when running in Expo Go on Android.

**Why:** `PROVIDER_GOOGLE` on Android requires the Google Maps API key to be embedded in
the native manifest at build time. In Expo Go, the app runs inside Expo's pre-built shell
which has its own manifest — our key is not present. Using `PROVIDER_GOOGLE` in Expo Go
crashes the MapView on Android. `PROVIDER_DEFAULT` on Android still renders Google Maps
(via Expo's built-in key) and supports `customMapStyle`, so the dark map style is preserved.

**Detection:** `Constants.appOwnership === 'expo'` from `expo-constants`.

**File:** `apps/mobile/app/(shipper)/post/route.tsx`

---

## 2026-05-22 — InDrive-style pricing: no platform commission

**Decision:** Loada charges drivers a flat subscription (weekly/monthly/annual).
There is no per-job commission deducted from the agreed price.

**Why:** This matches the InDrive model that drivers in Zimbabwe are familiar with.
Commission-based models require escrow and payment intermediation, which adds legal and
technical complexity. Flat subscriptions are simpler, more predictable for drivers, and
provide upfront revenue regardless of job completion rate.

**Schema impact:** `Job.askingPrice` and `Bid.offeredPrice` are the negotiated amounts
paid directly between shipper and driver (outside the platform, cash or EcoCash P2P).
The platform only processes subscription payments via Paynow.
