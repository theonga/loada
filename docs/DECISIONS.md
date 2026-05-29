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

## 2026-05-22 — InDrive-style pricing: no platform commission ~~(SUPERSEDED 2026-05-29)~~

**SUPERSEDED** by the 2026-05-29 "Wallet pay-per-use commission model" decision below.
The subscription tables, workers, routes, and config keys were removed on 2026-05-29.
This entry is kept for history.

**Original decision:** Loada charges drivers a flat subscription (weekly/monthly/annual).
There is no per-job commission deducted from the agreed price.

**Original why:** This matches the InDrive model. Commission-based models require escrow
and payment intermediation, which adds legal and technical complexity. Flat subscriptions
were simpler and provided upfront revenue.

**Why superseded:** Subscriptions create friction for new drivers (commit cash upfront
before earning anything) and create a perverse incentive for Loada to recruit drivers
who never get a job. A per-use commission model aligns Loada's incentives with the
drivers' success and lowers the barrier to first bid. See the 2026-05-29 decision for
details on the new wallet flow.

---

## 2026-05-29 — Wallet pay-per-use commission model (replaces subscriptions)

**Decision:** Loada charges a configurable commission percentage (`loada_commission_pct`,
default 15%) on each accepted bid, deducted from a driver-funded wallet. No subscriptions.

**Flow:**

1. Driver tops up wallet via Paynow (EcoCash / OneMoney / VMC card) — `WalletTransaction.type = DEPOSIT`
2. On `placeBid`: `reserveCommission` atomically moves `commissionAmount` from `DriverWallet.balance` to `DriverWallet.reservedBalance` and writes the amount to `Bid.commissionAmount`
3. On bid reject / job expire / pre-pickup cancel: `releaseCommission` moves the reserved amount back to `balance`
4. On `confirmDelivery` (or `auto-settle` worker): `deductCommission` retires the reserved amount as Loada revenue (`WalletTransaction.type = COMMISSION_DEDUCT`)

**Why:** Detailed in the SUPERSEDED 2026-05-22 entry above. Short version: better incentive
alignment, lower friction for new drivers, easier to A/B test pricing.

**Schema impact:** Removed `Subscription` and `SubscriptionPayment` tables and the
`SubscriptionPlan` / `SubscriptionStatus` enums. Added `DriverWallet` and `WalletTransaction`
with `WalletTxType` enum (`DEPOSIT | COMMISSION_RESERVE | COMMISSION_RELEASE | COMMISSION_DEDUCT | REFUND`).

**Service impact:** Deleted `subscription.service.ts`, `subscription-renewal.worker.ts`,
`subscription-expiry.worker.ts`, the `/v1/subscriptions/*` routes, the `requireActiveSubscription`
middleware, and the `subscription_price_*` / `trial_period_days` config keys.

**Trade-off accepted:** Drivers must keep wallet funded; an empty wallet means they can't
bid. The wallet UI shows a low-balance banner on the driver home screen, and the bid form
blocks with a clear "deposit to bid" CTA. Min deposit is `$min_deposit_usd` (default 10).

---

## 2026-05-29 — Anti-fraud / commission-integrity hardening

**Decision:** Closed seven holes in the commission system that could be exploited to
avoid the platform fee. The full list with severity is in the "Trust & Safety" section
of CLAUDE.md; the key technical decisions are recorded here.

### Server-side GPS proximity gate

**Decision:** `confirmPickup` and `confirmDelivery` reject the transition when the driver's
`DriverProfile.lastLocation*` is more than `delivery_gps_tolerance_km` (default 0.5 km)
from the waypoint, or the fix is older than 30 minutes.

**Why:** Without this, a driver could tap through every active-job screen from their
couch, deduct fake commission once, and farm rating count. The gate forces real device
presence at the waypoint.

**Important:** The check reads the location from the **server-side** `DriverProfile` row,
populated by the live `/location` socket heartbeat. **We do not trust the client-supplied
`lat`/`lng` in the request body** — those still ride along for storage on `Delivery`, but
the verification path ignores them. A malicious client could otherwise spoof any
coordinate.

**Alternative rejected:** Hardware attestation (Play Integrity, App Attest). Real
verification but adds platform-specific complexity and fails on the older Android devices
common in our target market.

### Locked shipper cancellation post-pickup

**Decision:** Shipper-initiated cancel is rejected with `POST_PICKUP_NO_SHIPPER_CANCEL`
once the job has reached `PICKUP_ARRIVED`. Admin can still force-cancel anything, but
the post-pickup admin cancel path **deducts** the accepted bid's commission instead of
refunding it.

**Why:** The original `performJobCancellation` refunded every reserved commission on any
non-terminal cancellation, including `DELIVERED`. Shipper + driver could collude: driver
delivers, shipper "cancels", commission is refunded. Now Loada keeps the cut on any
post-pickup cancellation.

**Refund matrix:**
- Pre-pickup cancel (POSTED..PICKUP_EN_ROUTE) → refund all commissions (no work done)
- Post-pickup cancel of accepted bid → deduct as if delivered
- Post-pickup cancel of losing bid → always refundable (they never did the work)

### Commission-amount fallback

**Decision:** When `confirmDelivery` sees `Bid.commissionAmount = null`, it recomputes
from `loada_commission_pct × Bid.offeredPrice` instead of silently skipping the deduction.
`deductCommission` is also resilient against reservation mismatch: pulls from
`reservedBalance` first then `balance` for any shortfall, with the wallet transaction
note annotated accordingly.

**Why:** The previous `if (acceptedBid?.commissionAmount) { ... }` guard meant any bid
without a stored commission (legacy bid from before the wallet system, future
admin-injected bid, migration glitch) paid no commission at all. Silent revenue leak with
no alarm.

### Self-trade prevention

**Decision:** `placeBid` throws `SELF_TRADE_FORBIDDEN` when the bidder's user ID equals
the job's shipper user ID.

**Why:** Now that a user can hold the `BOTH` role (see the 2026-05-29 OTP role-upgrade
decision), they could post a job and accept their own bid. Loada still collects commission,
but the activity is fake — inflates platform stats, lets the user move wallet funds out
as "earnings", and pollutes ratings. One-line check, zero downside.

### Auto-settle hourly worker

**Decision:** Added a new `auto-settle` BullMQ queue with a `0 * * * *` repeat schedule.
The worker runs `runAutoSettleSweep` which:

1. Force-completes `IN_TRANSIT` jobs idle for more than `auto_settle_in_transit_days`
   (default 7) — transitions to `DELIVERED` and runs `deductCommission`
2. Force-completes `DELIVERED` jobs idle for more than `auto_complete_delivered_hours`
   (default 72) — transitions to `COMPLETED` regardless of ratings

**Why:** Before this, a driver could ghost the trip — drop cargo, get paid by shipper,
never tap "Mark delivered". The reservation stayed locked but Loada never received the
commission. The driver self-penalised by being unable to take new jobs while ghosted, but
a single-shot cash run was enough motivation to walk away. Now the commission auto-settles
after a week.

**Why hourly cron instead of per-job delayed task:** Per-job delayed tasks are easy to
lose on Redis flushes or worker restarts. A periodic sweep is cheap and self-healing.

### Chat moderation flag (soft block)

**Decision:** Every chat message is scanned by `lib/chat-moderation.ts` against phone-number
patterns, contact-handle patterns (WhatsApp / Telegram / email), and collusion phrases
("off-platform", "skip the fee", "cash only", "cancel and re-post directly", etc.). Hits
are stored in `Message.flaggedReason` and surfaced on `/dashboard/audit`.

**Why hard-blocking is wrong here:** Cash-on-delivery is by design (Loada doesn't process
the shipper→driver payment). Some legitimate messages contain phone numbers (recipient
contact for delivery), some legitimate messages mention cash. Soft flagging keeps the UX
clean and pushes the judgement call onto admin review.

**Pattern surface lives in code, not config:** Regex patterns are versioned in git rather
than the AppConfig table because they're operationally sensitive — a bad config edit
could pin Loada below an alert threshold. The `low_bid_alert_pct` threshold *is* in
config because the trade-off is purely numerical.

### Low-bid alert query

**Decision:** `GET /v1/admin/audit/low-bids` runs a single PostGIS / SQL query that joins
each matched job with its accepted bid, computes the per-km × tonnage market estimate
(same per-km rates the `MarketReferenceWidget` fallback uses), and returns any row whose
`bidPrice / estimate < low_bid_alert_pct / 100`.

**Why SQL not Node:** Pure SQL keeps the query fast even at scale, and lets the admin
sort/paginate without loading every accepted bid into memory.

### New config keys (group `trust`)

| Key                              | Default | Effect                                       |
| -------------------------------- | ------- | -------------------------------------------- |
| `delivery_gps_tolerance_km`      | `0.5`   | GPS proximity tolerance for pickup/delivery |
| `auto_settle_in_transit_days`    | `7`     | IN_TRANSIT auto-settle threshold             |
| `auto_complete_delivered_hours`  | `72`    | DELIVERED auto-complete threshold            |
| `low_bid_alert_pct`              | `60`    | Low-bid alert threshold                      |

**Schema impact:** `Message.flaggedReason String?` with index on `(flaggedReason)`. No
other schema changes — all of the rest is service-layer.

---

## 2026-05-29 — OTP role upgrade to `BOTH` + in-app role switch

**Decision:** `verifyOTPAndLogin` now upgrades an existing single-role user to `BOTH`
when they sign in via the other role at the role-selection screen, automatically creating
the missing profile. Added `POST /v1/auth/switch-role` so `BOTH` users can flip their
active role without re-logging in.

**Why:** Previously, a user who signed up as `SHIPPER` and later picked `DRIVER` at the
role screen would be returned with their original `SHIPPER` role, the mobile would route
them to `/(driver)`, and they'd see an empty driver UX (no driver profile, can't bid,
no obvious recovery path). The new flow detects the mismatch and treats it as a role
upgrade request.

**Role-switch token:** The access token now carries the *active* role (not the user's
underlying `User.role`). Switching role re-signs a new access token with the new active
role baked in. Mobile auth store tracks `role` separately from `user.role`.

**Self-trade implication:** The role upgrade made self-trade trivially possible — closed
in the same PR by the `SELF_TRADE_FORBIDDEN` check in `placeBid`.

---

## 2026-05-29 — Active-job screen routing keyed off `job.status`

**Decision:** Driver-side entry points to the active job (`/(driver)/index.tsx` active
card, `/(driver)/loads/index.tsx` Active tab, `/(driver)/match/[jobId].tsx`) now use
`activeScreenForStatus(job.status)` to pick the right screen instead of always pushing
`/active/en-route`. Each active screen also calls `useActiveJobRouteGuard` which redirects
to the correct screen when the in-memory job has progressed past the screen's expected
status.

**Why:** The previous flow always landed the driver on `/active/en-route` regardless of
the server-side job status. A driver who'd already completed pickup and was in
`IN_TRANSIT` would re-enter from home and see "I've arrived at pickup" — tapping it
silently failed because the server enforces `PICKUP_ARRIVED` as the prerequisite. Users
thought the system suspected them of lying about pickup.

**Hook contract:** `useActiveJobRouteGuard(job, expectedPath)` is a no-op for matching
or null status. It only fires when the server says the job is on a different step.
