# Loada — Tech Stack Reference

Last updated: 2026-05-26

---

## Overview

Loada is a React Native logistics marketplace with a Fastify backend, deployed on a
single EC2 instance for MVP. The stack is chosen for operational simplicity over
theoretical scalability — one box, no container orchestration, no managed queues.

---

## Applications

| App | Framework | Language | Port |
|-----|-----------|----------|------|
| `apps/mobile` | React Native + Expo SDK 53 | TypeScript | — |
| `apps/api` | Fastify 5 | TypeScript (Node.js LTS) | 3000 |
| `apps/admin` | Next.js 14 (App Router) | TypeScript | 3001 |

---

## Core services

| Service | Technology | Hosted on | Notes |
|---------|-----------|-----------|-------|
| Primary database | PostgreSQL 16 + PostGIS | Amazon RDS t3.micro | Single-AZ for MVP |
| Cache + queues | Redis 7 | EC2 (same instance) | No persistence (`save ""`) |
| Object storage | Amazon S3 | AWS us-east-1 | Private bucket, presigned URLs |
| Realtime | Socket.IO 4 | Same process as API | Fork mode, single instance |
| Background jobs | BullMQ 5 | Same EC2 | 5 PM2 worker processes |
| Process manager | PM2 5 | EC2 | Fork mode, no cluster |
| Reverse proxy | NGINX | EC2 | SSL termination, WebSocket upgrade |

---

## Third-party integrations

| Integration | Provider | Purpose |
|-------------|----------|---------|
| Maps | Google Maps Platform | Geocoding, Places Autocomplete, Directions, Distance Matrix |
| Push notifications | Firebase Cloud Messaging (FCM) | iOS + Android push via Expo |
| SMS | BulkIT (`api.npr.bulkit.co.zw`) | OTP + transactional SMS (Zimbabwe) |
| Payments | Paynow | EcoCash, OneMoney, Visa/Mastercard (Zimbabwe) |
| DNS + CDN | Cloudflare | DNS proxied for API + admin; DNS-only for socket subdomain |
| Error tracking | Sentry | API (`@sentry/node`) + Mobile (`@sentry/react-native`) |
| Metrics | Grafana Cloud (free tier) | API latency, queue depth, error rates |

---

## Key library versions

### API (`apps/api`)

| Package | Version | Notes |
|---------|---------|-------|
| `fastify` | 5.x | Not Express |
| `@prisma/client` | 5.22.x | Pinned at v5 — see DECISIONS.md |
| `prisma` | 5.22.x | Schema at `apps/api/prisma/schema.prisma` |
| `ioredis` | 5.x | `maxRetriesPerRequest: null` required for BullMQ |
| `bullmq` | 5.x | Redis-backed job queues |
| `socket.io` | 4.x | WebSocket + long-polling fallback |
| `@fastify/jwt` | — | Access tokens (15 min), Admin tokens (8 hr) |
| `bcryptjs` | — | Refresh token hashing |
| `dayjs` | — | Date arithmetic for subscription periods |
| `@googlemaps/google-maps-services-js` | — | Server-side Maps API calls |
| `firebase-admin` | — | FCM push notifications |

### Mobile (`apps/mobile`)

| Package | Version | Notes |
|---------|---------|-------|
| `expo` | SDK 53 | Bare workflow |
| `expo-router` | 4.x | File-based routing |
| `react-native-maps` | 1.20.1 | `PROVIDER_DEFAULT` in Expo Go, `PROVIDER_GOOGLE` in builds |
| `@gorhom/bottom-sheet` | — | Load detail, counter modal, tracking sheet |
| `zustand` | — | Global state (auth, location, job draft) |
| `axios` | — | HTTP client (base URL from `EXPO_PUBLIC_API_URL`) |
| `socket.io-client` | — | Realtime events |
| `expo-constants` | 18.x | Detect Expo Go vs native build |
| `expo-location` | 19.x | GPS for driver presence |
| `expo-camera` | — | POD photo capture |
| `expo-notifications` | — | Dynamic import in Expo Go (SDK 53 breaking change) |

---

## Data flow — key paths

### Driver location updates (every 10s while online)
```
Mobile (expo-location) → Socket.IO /location → updateDriverLocation()
→ Redis GEOADD loada:drivers:online <lng> <lat> <driverId>
→ DriverProfile.lastLocationLat/Lng updated every 60s (not on each ping)
```

### Job matching (on job post)
```
POST /jobs → createJob() → PostGIS GEORADIUS query → filter by capacity/subscription/docs
→ BullMQ notification queue → FCM push to qualifying drivers
→ BullMQ bid-expiry queue (delay = bid_ttl_seconds)
→ BullMQ radius-expansion queue (delay = radius_expansion_interval_seconds)
```

### Subscription payment (Paynow polling model)
```
POST /subscriptions → initiatePayment() → Paynow returns pollUrl
→ BullMQ paynow-poll queue (polls every 10s, max 5 min)
→ On PAID: handlePaymentConfirmed() → subscription.status = ACTIVE → FCM + SMS
```

### Google Places (via API proxy)
```
Mobile → GET /places/autocomplete → placesAutocomplete() → Redis cache check
→ Google Maps Places API → Redis setex (TTL 15 min) → return predictions
```
API key is never exposed to the mobile client. All Maps calls are server-side.

---

## Environment variables

Full list in `apps/api/.env.example` and `apps/mobile/.env.example`.

**Never commit `.env` files.** CI/CD should inject secrets from AWS Secrets Manager or
a secrets store — not from the repository.

---

## Development setup

### Prerequisites
- Node.js 22 LTS
- PostgreSQL 16 (local) with PostGIS extension
- Redis 7 (local)

### Start the API
```bash
cd apps/api
cp .env.example .env        # fill in local values
npm install
npm run db:push             # sync schema (no migration files in dev)
npm run db:seed             # seed 2 shippers, 8 drivers, 6 jobs, admin user
npm run dev                 # ts-node-dev with hot reload on port 3000
```

### Start the admin panel
```bash
cd apps/admin
npm install
npm run dev                 # Next.js dev on port 3001
```

### Start the mobile app
```bash
cd apps/mobile
cp .env.example .env.local  # set EXPO_PUBLIC_API_URL to your machine's LAN IP
npm install
npx expo start --clear      # --clear required after .env changes
```

> **Android note:** `localhost` does not resolve to the dev machine from an Android
> device or emulator. Set `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3000`.

---

## PostGIS local setup

The API uses PostGIS for proximity queries (available loads near driver, radius expansion).
Enable it on the local PostgreSQL cluster:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

RDS has PostGIS pre-installed. Enable it per-database:
```sql
CREATE EXTENSION postgis;
```

---

## BullMQ workers

Workers run in the same Node.js process as the API in development.
In production they run as separate PM2 processes (see `ecosystem.config.js`).

| Worker | Queue | Trigger |
|--------|-------|---------|
| `bid-expiry.worker.ts` | `bid-expiry` | Scheduled on job post |
| `radius-expansion.worker.ts` | `radius-expansion` | 60s after job post |
| `notification.worker.ts` | `notification` | Any event requiring push/SMS |
| `subscription-renewal.worker.ts` | `subscription-renewal` | Daily cron |
| `paynow-poll.worker.ts` | `paynow-poll` | On payment initiation |
