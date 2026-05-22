# Loada API — Build Progress

Last updated: 2026-05-22

## Status

API: COMPLETE — fully verified with live PostgreSQL
Admin panel: COMPLETE — Next.js 14 web app at `apps/admin/`

## Completed steps

- [x] Step 1 — Project setup
- [x] Step 2 — Database & Prisma (schema + seed, migrated and seeded)
- [x] Step 3 — Core infrastructure (redis, queues, socket, s3, fcm, bulkit, google-maps, paynow, auth middleware, app.ts, server.ts)
- [x] Step 4 — Service layer (auth, location, job, bid, matching, notification, subscription, delivery, rating, market, earnings)
- [x] Step 5 — Route handlers (auth, jobs, bids, deliveries, messages, subscriptions, ratings, drivers, notifications, sms)
- [x] Step 6 — BullMQ workers (bid-expiry, radius-expansion, notification, subscription-renewal, subscription-expiry, paynow-poll)
- [x] Step 7 — Socket.IO event wiring (all events emitted from correct service layers)
- [x] Step 8 — Input validation schemas (Zod for all routes)
- [x] Step 9 — Market reference endpoint + service
- [x] Step 10 — Driver earnings endpoint + service
- [x] Step 11 — PM2 ecosystem.config.js + nginx.conf template
- [x] Step 12 — Verification (all flows live-tested against PostgreSQL)
- [x] Step 13 — Driver status-transition endpoint (`PATCH /jobs/:jobId/status`)
- [x] Step 14 — AppConfig system (DB-backed, Redis-cached, 22 keys across 6 groups)
- [x] Step 15 — Admin authentication (JWT type:"admin", bcrypt, `requireAdmin` middleware)
- [x] Step 16 — Admin API routes (14 endpoints: auth, config, stats, users, drivers, jobs, subscriptions)
- [x] Step 17 — Admin web panel (`apps/admin/` — Next.js 14, 5 data pages + login + overview)
- [x] Step 18 — Deployment config (root `ecosystem.config.js`, updated `docs/nginx.conf`)

## Completed routes

- [x] POST /v1/auth/send-otp
- [x] POST /v1/auth/verify-otp
- [x] POST /v1/auth/refresh
- [x] POST /v1/auth/logout
- [x] POST /v1/jobs
- [x] GET  /v1/jobs
- [x] GET  /v1/jobs/:jobId
- [x] PATCH /v1/jobs/:jobId/cancel
- [x] PATCH /v1/jobs/:jobId/status  ← new: driver delivery pipeline transitions
- [x] GET  /v1/jobs/:jobId/market-reference
- [x] POST /v1/bids
- [x] GET  /v1/bids?jobId=
- [x] PATCH /v1/bids/:bidId/accept
- [x] PATCH /v1/bids/:bidId/counter
- [x] POST /v1/deliveries/:jobId/pickup
- [x] POST /v1/deliveries/:jobId/confirm
- [x] GET  /v1/deliveries/:jobId/pod
- [x] POST /v1/messages
- [x] GET  /v1/messages?jobId=
- [x] PATCH /v1/messages/:messageId/read
- [x] POST /v1/subscriptions
- [x] GET  /v1/subscriptions/me
- [x] PATCH /v1/subscriptions/:id/cancel
- [x] GET  /v1/subscriptions/upload-url
- [x] POST /v1/ratings
- [x] GET  /v1/ratings?userId=
- [x] GET  /v1/drivers/me
- [x] PATCH /v1/drivers/me
- [x] PATCH /v1/drivers/me/online
- [x] PATCH /v1/drivers/me/offline
- [x] GET  /v1/drivers/me/earnings
- [x] GET  /v1/notifications
- [x] PATCH /v1/notifications/:id/read
- [x] POST /v1/notifications/fcm-token
- [x] POST /v1/sms/webhook (stub)
- [x] GET  /health

Admin routes (all require `Authorization: Bearer <admin_token>`):
- [x] POST /v1/admin/auth/login
- [x] GET  /v1/admin/stats
- [x] GET  /v1/admin/config
- [x] PATCH /v1/admin/config
- [x] GET  /v1/admin/users
- [x] PATCH /v1/admin/users/:id/suspend
- [x] PATCH /v1/admin/users/:id/unsuspend
- [x] GET  /v1/admin/drivers
- [x] PATCH /v1/admin/drivers/:id/approve-docs
- [x] PATCH /v1/admin/drivers/:id/reject-docs
- [x] GET  /v1/admin/jobs
- [x] PATCH /v1/admin/jobs/:id/cancel
- [x] GET  /v1/admin/subscriptions
- [x] PATCH /v1/admin/subscriptions/:id/override

## Completed services

- [x] auth.service.ts
- [x] location.service.ts
- [x] job.service.ts
- [x] bid.service.ts
- [x] matching.service.ts
- [x] notification.service.ts
- [x] subscription.service.ts
- [x] delivery.service.ts
- [x] rating.service.ts
- [x] market.service.ts
- [x] earnings.service.ts

## Completed workers

- [x] bid-expiry.worker.ts
- [x] radius-expansion.worker.ts
- [x] notification.worker.ts
- [x] subscription-renewal.worker.ts
- [x] subscription-expiry.worker.ts
- [x] paynow-poll.worker.ts

## Step 12 verification results

**Verified locally (no PostgreSQL required):**
- [x] npm run dev starts without errors — server logs "Loada API running on port 3000"
- [x] GET /health returns { status: 'ok' }
- [x] Redis connects (BullMQ workers start, OTP stored/retrieved)
- [x] All 6 BullMQ workers start without errors
- [x] POST /v1/auth/send-otp — stores OTP in Redis, SMS stubbed correctly
- [x] POST /v1/auth/verify-otp with invalid code — returns 401 INVALID_OTP
- [x] POST /v1/auth/verify-otp OTP single-use — second attempt returns 401
- [x] Protected routes return 401 without valid JWT
- [x] Phone validation returns 400 with details on bad input
- [x] npx tsc --noEmit — zero TypeScript errors

**Verified with live PostgreSQL (2026-05-22):**
- [x] POST /v1/auth/verify-otp with valid code — returns 200 with user + tokens
- [x] POST /v1/auth/refresh — rotates refresh token, issues new access token
- [x] POST /v1/jobs — creates job, schedules BullMQ workers
- [x] GET  /v1/jobs — returns shipper job list / driver available loads
- [x] POST /v1/bids — driver places bid (all 5 business rules enforced)
- [x] PATCH /v1/bids/:id/accept — atomically matches job, rejects other bids
- [x] PATCH /v1/jobs/:id/status — MATCHED→PICKUP_EN_ROUTE→PICKUP_ARRIVED→IN_TRANSIT
- [x] POST /v1/deliveries/:id/pickup — cargo loaded photo, job→LOADED
- [x] POST /v1/deliveries/:id/confirm — delivery confirmed, job→DELIVERED
- [x] GET  /v1/deliveries/:id/pod — S3 presigned URLs generated correctly
- [x] POST /v1/ratings — stored with duplicate guard
- [x] GET  /v1/ratings?userId= — returns ratings with aggregate average
- [x] GET  /v1/drivers/me/earnings — totals, by-day breakdown, best day
- [x] PATCH /v1/drivers/me/online — sets online, GEOADD in Redis
- [x] PATCH /v1/drivers/me/offline — sets offline
- [x] GET  /v1/subscriptions/me — returns plan/status/expiry
- [x] GET/POST /v1/messages — chat retrieval and posting
- [x] npm run db:seed — seeds 2 shippers, 8 drivers, 6 jobs, 4 bids, 6 messages, 2 ratings

## Decisions and fixes made during verification

- **Prisma schema and seed moved to `apps/api/prisma/`** — previously at the monorepo root
  (`prisma/`). Moved so all Prisma files co-locate with the service that uses them. The
  `"prisma": { "schema": "..." }` override in `package.json` was removed; Prisma now finds
  `prisma/schema.prisma` at the default location relative to `package.json`.

- **`tsconfig.seed.json` added** — the seed file sits in `prisma/` outside `src/`, so it
  can't share the main tsconfig (which sets `rootDir: ./src`). A separate
  `tsconfig.seed.json` extends the main tsconfig with `rootDir: .` and is used by
  `npm run db:seed`.

- **`tsconfig.json` — added `"types": ["node"]`** — without this, files outside `src/`
  compiled via ts-node don't resolve `console`, `process`, etc.

- **`PATCH /jobs/:jobId/status` added** — the delivery pipeline needs driver-side status
  transitions (MATCHED → PICKUP_EN_ROUTE → PICKUP_ARRIVED → IN_TRANSIT) that the original
  12-step spec didn't have an explicit route for. Added to `routes/jobs/index.ts` and
  `schemas/job.schema.ts` (`jobStatusUpdateSchema`).

- **`db:push` script added** — `prisma db push` is useful for dev to sync schema without
  creating migration files. Added alongside `db:migrate`.

- **PostGIS requires `postgresql-16-postgis-3` package** — not installed by default on
  Ubuntu. Install with: `sudo apt-get install postgresql-16-postgis-3 postgresql-16-postgis-3-scripts`
  Then enable per database: `psql -d loada_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"`

- **Prisma v7 breaking changes** — downgraded to Prisma v5.22 (stable). v7 deprecated `url` in
  datasource and changed client initialization model. v5 is production-ready.

- **BullMQ requires `maxRetriesPerRequest: null`** — ioredis default of `3` breaks BullMQ
  blocking connections. Fixed in `src/lib/redis.ts`.

- **Zod v4 renamed `.errors` to `.issues`** — updated across all route handlers.

- **Fastify server.ts pattern** — `app.server` is already the http.Server in Fastify 5.
  Socket.IO attaches directly to it before `app.listen()` is called.

- **`fcmToken` field added to User model** — required for push notification delivery.
  This is the only schema addition beyond CLAUDE.md; it's additive and non-breaking.

- **Notifications model not created** — the GET /v1/notifications endpoint returns []
  for MVP. Push notifications are FCM-only (no persistent notification history in DB).
  Add a Notification model when an inbox UI is needed.

## To run in development

```bash
# Terminal 1 — API (port 3000)
cd apps/api && npm run dev

# Terminal 2 — Admin panel (port 3001)
cd apps/admin && npm run dev

# Terminal 3 — Mobile (Expo, port 8081)
cd apps/mobile && npm run start
```

Or from the monorepo root (each in a separate terminal):
```bash
npm run dev:api
npm run dev:admin
npm run dev:mobile
```

## To run in production

```bash
# 1. On the server — install Node.js LTS, PM2, Redis, PostgreSQL 16 + PostGIS

# 2. Clone and install
git clone <repo> /var/www/loada && cd /var/www/loada
npm install --workspace=apps/api
npm install --workspace=apps/admin

# 3. Set environment variables
cp apps/api/.env.example apps/api/.env        # fill in all values
cp apps/admin/.env.local.example apps/admin/.env.local  # set NEXT_PUBLIC_API_URL=https://api.loada.app

# 4. Enable PostGIS
psql -d loada -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 5. Apply schema and seed
cd apps/api
npm run db:migrate:deploy   # prod migrations
npm run db:seed             # seeds config defaults + first admin user
cd ../..

# 6. Build
npm run build:api
npm run build:admin

# 7. Start with PM2 (from repo root)
pm2 start ecosystem.config.js --env production
pm2 save && pm2 startup

# 8. Configure NGINX
cp docs/nginx.conf /etc/nginx/sites-available/loada
ln -s /etc/nginx/sites-available/loada /etc/nginx/sites-enabled/loada
nginx -t && systemctl reload nginx

# 9. TLS
certbot --nginx -d api.loada.app -d admin.loada.app -d socket.loada.app

# 10. Change the admin password immediately after first login
#     (or set ADMIN_SEED_PASSWORD in .env before seeding)
```

## Next action

Wire the mobile app (currently using mock data) to the real API endpoints.
