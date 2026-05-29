# CLAUDE.md — Loada Project

This file is the single source of truth for Claude when working on the Loada codebase.
Read this entire file before writing any code, creating any file, or making any architectural decision.

---

## What is Loada

Loada is a mobile logistics marketplace for truck freight — one app, two roles (shipper and driver).
Shippers post loads. Drivers bid. Both sides negotiate price directly (InDrive model).
Loada uses a pay-per-use wallet model: drivers top up a wallet, and Loada charges a configurable
commission percentage on each bid (reserved on bid placement, deducted on job completion, released on bid rejection/expiry).
There are NO subscriptions on the platform.
Target market: Zimbabwe (launch city), expanding to Southern Africa.
Payment rails: Paynow (EcoCash, OneMoney, card) — used only for wallet top-ups.

---

## Monorepo structure

```
loada/
├── apps/
│   ├── mobile/          # React Native (Expo) — single app, two roles
│   ├── admin/           # Next.js 14 web app — admin panel (port 3001)
│   └── api/             # Node.js + Fastify + TypeScript backend
│       └── prisma/
│           ├── schema.prisma    # Single source of truth for the data model
│           ├── seed.ts          # Dev seed (2 shippers, 8 drivers, 6 jobs, config, admin user)
│           └── migrations/      # Never edit manually
├── packages/
│   ├── types/           # Shared TypeScript types (used by both apps)
│   ├── utils/           # Shared utility functions
│   └── constants/       # Shared constants (tonnage tiers, job statuses, etc.)
├── designs/             # Claude Design output — source of truth for UI
│   ├── screens-onboarding.jsx   # Screens 01–05 (splash → paywall)
│   ├── screens-shipper.jsx      # Screens 06–15 (home → rate driver)
│   ├── screens-driver.jsx       # Screens 16–24 (home → earnings)
│   ├── screens-shared.jsx       # Screens 25–30 (chat → counter modal)
│   ├── ui.jsx                   # Shared UI primitives (Avatar, Stars, MapPin, etc.)
│   ├── styles.css               # Design tokens — canonical CSS variables
│   ├── app.jsx                  # Design canvas entry point
│   ├── design-canvas.jsx        # Canvas layout and screen registry
│   ├── ios-frame.jsx            # Phone frame component
│   └── index.html               # Standalone viewer — open in browser to review all screens
├── docs/
│   ├── TECH_STACK.md
│   ├── DECISIONS.md     # Architectural decision log
│   ├── API.md           # API reference
│   └── DESIGN_AUDIT.md  # Full audit of designs/ against spec — read before building any screen
├── CLAUDE.md            # This file
├── package.json         # Workspace root
└── turbo.json           # Turborepo config
```

---

## Tech stack — locked, do not change without updating this file

| Layer              | Technology                     | Notes                                                          |
| ------------------ | ------------------------------ | -------------------------------------------------------------- |
| Mobile             | React Native + Expo SDK        | TypeScript, single app two roles                               |
| Backend runtime    | Node.js LTS                    | TypeScript                                                     |
| API framework      | Fastify                        | Not Express                                                    |
| ORM                | Prisma                         | PostgreSQL adapter                                             |
| Realtime           | Socket.IO                      | WebSocket + fallback                                           |
| Queue              | BullMQ                         | Redis-backed                                                   |
| Primary DB         | PostgreSQL on Amazon RDS       | Single-AZ for MVP, PostGIS enabled                             |
| Cache + state      | Redis                          | On EC2 for MVP                                                 |
| Maps               | Google Maps Platform           | Geocoding, Places, Directions, Distance Matrix                 |
| Push notifications | Firebase Cloud Messaging (FCM) | Via Expo notifications                                         |
| SMS                | BulkIT                         | Custom webhook — hook configured separately, not at build time |
| Payments           | Paynow                         | EcoCash, OneMoney, card                                        |
| File storage       | Amazon S3                      | POD images, driver documents, chat media                       |
| Infrastructure     | AWS (EC2 t3.medium + RDS + S3) | PM2 + NGINX, no Docker for MVP                                 |
| DNS + security     | Cloudflare                     | DNS-only mode for Socket.IO subdomain                          |
| Error tracking     | Sentry                         | Both mobile and API                                            |
| Metrics            | Grafana Cloud                  | Free tier                                                      |

---

## Environment variables

All secrets live in `.env` files — never committed to git.
The `.env.example` at each app root documents every required variable.
Never hardcode secrets, API keys, or connection strings in source code.

### API environment variables

```
NODE_ENV=
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=
GOOGLE_MAPS_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
BULKIT_API_KEY=
BULKIT_SENDER_ID=
BULKIT_WEBHOOK_SECRET=
PAYNOW_INTEGRATION_ID=
PAYNOW_INTEGRATION_KEY=
SENTRY_DSN=
```

### Mobile environment variables (via Expo)

```
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SOCKET_URL=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
EXPO_PUBLIC_SENTRY_DSN=
```

---

## Data model — Prisma schema

The canonical data model lives at `apps/api/prisma/schema.prisma`.
When adding fields, always update `apps/api/prisma/schema.prisma` first,
run `npm run db:migrate` from `apps/api/` (or `npm run db:push` for dev without migration files),
then update the affected service code. Never write raw SQL migrations by hand.

### Tonnage tiers

Stored as integers. Valid values: `1, 2, 5, 10, 20, 30`.
Use the `TONNAGE_TIERS` constant from `packages/constants` — never hardcode these values in app code.

### Job statuses

```
DRAFT → POSTED → BIDDING → RADIUS_EXPANDED → MATCHED → PICKUP_EN_ROUTE →
PICKUP_ARRIVED → LOADED → IN_TRANSIT → DELIVERED → COMPLETED → CANCELLED | DISPUTED
```

Use the `JobStatus` enum from `packages/types` — never use raw strings for status comparisons.

### Core tables

```prisma
model User {
  id                String          @id @default(uuid())
  phone             String          @unique
  name              String
  role              UserRole        // SHIPPER | DRIVER | BOTH
  profilePhotoUrl   String?
  isVerified        Boolean         @default(false)
  isSuspended       Boolean         @default(false)
  suspensionReason  String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  shipperProfile    ShipperProfile?
  driverProfile     DriverProfile?
  sentMessages      Message[]       @relation("SentMessages")
  ratingsGiven      Rating[]        @relation("RatingsGiven")
  ratingsReceived   Rating[]        @relation("RatingsReceived")
}

model ShipperProfile {
  id          String  @id @default(uuid())
  userId      String  @unique
  companyName String?
  user        User    @relation(fields: [userId], references: [id])
  jobs        Job[]
}

model DriverProfile {
  id                   String             @id @default(uuid())
  userId               String             @unique
  capacityTonnes       Int                // 1 | 2 | 5 | 10 | 20 | 30
  truckRegistration    String
  truckMake            String
  truckModel           String
  truckYear            Int
  truckPhotoUrl        String?
  licenceUrl           String?
  licenceExpiry        DateTime?
  registrationUrl      String?
  registrationExpiry   DateTime?
  documentStatus       DocumentStatus     @default(PENDING)
  isOnline             Boolean            @default(false)
  lastLocationLat      Float?
  lastLocationLng      Float?
  lastLocationAt       DateTime?
  user                 User               @relation(fields: [userId], references: [id])
  wallet               DriverWallet?
  bids                 Bid[]
}

model Job {
  id                  String          @id @default(uuid())
  shipperId           String
  shipper             ShipperProfile  @relation(fields: [shipperId], references: [id])
  originAddress       String
  originLat           Float
  originLng           Float
  destAddress         String
  destLat             Float
  destLng             Float
  cargoDescription    String
  requiredTonnes      Int             // 1 | 2 | 5 | 10 | 20 | 30
  specialRequirements String[]        // ["FRAGILE","REFRIGERATED","OVERSIZED","HAZARDOUS"]
  askingPrice         Decimal         @db.Decimal(10, 2)
  currency            String          @default("USD")
  status              JobStatus       @default(POSTED)
  searchRadiusKm      Int             @default(25)
  biddingExpiresAt    DateTime?
  matchedDriverId     String?
  matchedBidId        String?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt
  bids                Bid[]
  delivery            Delivery?
  messages            Message[]
  ratings             Rating[]
}

model Bid {
  id            String        @id @default(uuid())
  jobId         String
  driverId      String
  offeredPrice  Decimal       @db.Decimal(10, 2)
  currency      String        @default("USD")
  status        BidStatus     @default(PENDING)
  note          String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  job           Job           @relation(fields: [jobId], references: [id])
  driver        DriverProfile @relation(fields: [driverId], references: [id])
}

model Delivery {
  id                  String    @id @default(uuid())
  jobId               String    @unique
  job                 Job       @relation(fields: [jobId], references: [id])
  pickupConfirmedAt   DateTime?
  pickupPhotoUrl      String?
  deliveredAt         DateTime?
  deliveryPhotoUrl    String?
  recipientName       String?
  signatureUrl        String?
  pickupLat           Float?
  pickupLng           Float?
  deliveryLat         Float?
  deliveryLng         Float?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model DriverWallet {
  id              String              @id @default(uuid())
  driverId        String              @unique
  driver          DriverProfile       @relation(fields: [driverId], references: [id])
  balance         Decimal             @default(0) @db.Decimal(10, 2)
  reservedBalance Decimal             @default(0) @db.Decimal(10, 2)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  transactions    WalletTransaction[]
}

model WalletTransaction {
  id         String         @id @default(uuid())
  walletId   String
  wallet     DriverWallet   @relation(fields: [walletId], references: [id])
  type       WalletTxType   // DEPOSIT | COMMISSION_RESERVE | COMMISSION_RELEASE | COMMISSION_DEDUCT | REFUND
  amount     Decimal        @db.Decimal(10, 2)
  bidId      String?
  jobId      String?
  paynowRef  String?
  note       String?
  status     PaymentStatus  @default(PENDING)
  createdAt  DateTime       @default(now())
}

model Message {
  id          String    @id @default(uuid())
  jobId       String
  senderId    String
  content     String?
  mediaUrl    String?
  mediaType   String?   // "image" | "voice"
  isRead      Boolean   @default(false)
  createdAt   DateTime  @default(now())
  job         Job       @relation(fields: [jobId], references: [id])
  sender      User      @relation("SentMessages", fields: [senderId], references: [id])
}

model Rating {
  id         String   @id @default(uuid())
  jobId      String
  fromUserId String
  toUserId   String
  score      Int      // 1–5
  comment    String?
  tags       String[] // ["ON_TIME","CAREFUL_WITH_CARGO","PROFESSIONAL","GOOD_COMMUNICATION"]
  createdAt  DateTime @default(now())
  job        Job      @relation(fields: [jobId], references: [id])
  fromUser   User     @relation("RatingsGiven", fields: [fromUserId], references: [id])
  toUser     User     @relation("RatingsReceived", fields: [toUserId], references: [id])
}
```

### Enums

```prisma
enum UserRole        { SHIPPER DRIVER BOTH }
enum DocumentStatus  { PENDING UNDER_REVIEW APPROVED REJECTED EXPIRED }
enum JobStatus       { DRAFT POSTED BIDDING RADIUS_EXPANDED MATCHED PICKUP_EN_ROUTE
                       PICKUP_ARRIVED LOADED IN_TRANSIT DELIVERED COMPLETED CANCELLED DISPUTED }
enum BidStatus       { PENDING COUNTERED ACCEPTED REJECTED EXPIRED }
enum PaymentStatus   { PENDING PAID FAILED REFUNDED }
enum WalletTxType    { DEPOSIT COMMISSION_RESERVE COMMISSION_RELEASE COMMISSION_DEDUCT REFUND }
```

There are no subscription enums on the platform — Loada uses the wallet/commission model only.

---

## Design reference

The `designs/` folder at the repo root contains the complete Claude Design output for
the Loada app. It is the authoritative visual reference for all mobile UI work.

**Before building any screen or component, open `designs/index.html` in a browser**
to see the interactive canvas with all 30 screens. Do not build from memory or
from description alone — always check the design file.

### Screen inventory (30 screens)

| #   | Screen                      | File                   | Expo Router path                              |
| --- | --------------------------- | ---------------------- | --------------------------------------------- |
| 01  | Splash                      | screens-onboarding.jsx | `app/(auth)/index.tsx`                        |
| 02  | Role selection              | screens-onboarding.jsx | `app/(auth)/role.tsx`                         |
| 03  | OTP verification            | screens-onboarding.jsx | `app/(auth)/otp.tsx`                          |
| 04  | Driver documents            | screens-onboarding.jsx | `app/(auth)/driver-setup/documents.tsx`       |
| 05  | Driver paywall              | screens-onboarding.jsx | `app/(auth)/driver-setup/paywall.tsx`         |
| 06  | Shipper home (map)          | screens-shipper.jsx    | `app/(shipper)/index.tsx`                     |
| 07  | Post load — route           | screens-shipper.jsx    | `app/(shipper)/post/route.tsx`                |
| 08  | Post load — cargo           | screens-shipper.jsx    | `app/(shipper)/post/cargo.tsx`                |
| 09  | Post load — pricing         | screens-shipper.jsx    | `app/(shipper)/post/pricing.tsx`              |
| 10  | Bid inbox — list view       | screens-shipper.jsx    | `app/(shipper)/bids/[jobId].tsx`              |
| 11  | Bid inbox — terminal        | screens-shipper.jsx    | `app/(shipper)/bids/[jobId].tsx` (tab toggle) |
| 12  | Match confirmed (shipper)   | screens-shipper.jsx    | `app/(shipper)/match/[jobId].tsx`             |
| 13  | Active job tracking         | screens-shipper.jsx    | `app/(shipper)/tracking/[jobId].tsx`          |
| 14  | Proof of delivery (shipper) | screens-shipper.jsx    | `app/(shipper)/delivery/[jobId].tsx`          |
| 15  | Rate driver                 | screens-shipper.jsx    | `app/(shipper)/rate/[jobId].tsx`              |
| 16  | Driver home (map)           | screens-driver.jsx     | `app/(driver)/index.tsx`                      |
| 17  | Available loads list        | screens-driver.jsx     | `app/(driver)/loads/index.tsx`                |
| 18  | Load detail (bottom sheet)  | screens-driver.jsx     | `app/(driver)/loads/[jobId].tsx`              |
| 19  | Place bid                   | screens-driver.jsx     | `app/(driver)/bid/[jobId].tsx`                |
| 20  | Match confirmed (driver)    | screens-driver.jsx     | `app/(driver)/match/[jobId].tsx`              |
| 21  | En route to pickup          | screens-driver.jsx     | `app/(driver)/active/en-route.tsx`            |
| 22  | Confirm cargo loaded        | screens-driver.jsx     | `app/(driver)/active/pickup.tsx`              |
| 23  | Job complete                | screens-driver.jsx     | `app/(driver)/active/complete.tsx`            |
| 24  | Driver earnings             | screens-driver.jsx     | `app/(driver)/earnings/index.tsx`             |
| 25  | In-app chat                 | screens-shared.jsx     | `app/(shared)/chat/[jobId].tsx`               |
| 26  | Notifications centre        | screens-shared.jsx     | `app/(shared)/notifications.tsx`              |
| 27  | Driver profile              | screens-shared.jsx     | `app/(driver)/profile/index.tsx`              |
| 28  | Help & support              | screens-shared.jsx     | `app/(shared)/help.tsx`                       |
| 29  | Empty state — no bids       | screens-shared.jsx     | `components/job/EmptyBids.tsx`                |
| 30  | Counter-offer modal         | screens-shared.jsx     | `components/job/CounterModal.tsx`             |

### Screens still needed (not yet designed)

These are missing and block development. Design them before starting the affected flows.

| Priority | Screen                                              | Blocks              |
| -------- | --------------------------------------------------- | ------------------- |
| P0       | Phone number entry                                  | Entire auth flow    |
| P0       | Post load — step 4 review & confirm                 | Post-load flow      |
| P1       | Shipper profile                                     | Shipper settings    |
| P1       | Driver bid status (pending / counter-received)      | Driver bid flow     |
| P1       | En route to delivery                                | Delivery flow       |
| P1       | Delivery proof capture — driver (photo + signature) | Delivery completion |
| P1       | Driver job history list                             | Driver jobs tab     |
| P2       | Issue reporting flow (3 screens)                    | In-job safety       |
| P2       | Settings screen                                     | Profile tab         |
| P2       | Driver onboarding status screen                     | New driver UX       |

### Shared component library — build these first

Extract these components from the designs before building any individual screen.
They appear across multiple screens and must be consistent.

| Component                                  | Source in designs      | Notes                                        |
| ------------------------------------------ | ---------------------- | -------------------------------------------- |
| `<Statusbar/>`                             | ios-frame.jsx          | Time, battery, signal icons                  |
| `<TabBar role activeTab/>`                 | ui.jsx                 | 4 tabs per role, icon-only, accent on active |
| `<MapBg variant/>`                         | ui.jsx                 | Dark tile background placeholder             |
| `<MapPin kind label? scale?/>`             | ui.jsx                 | me / driver / load / origin / dest variants  |
| `<RouteLine a b dashed?/>`                 | ui.jsx                 | SVG line between two map points              |
| `<Avatar name size/>`                      | ui.jsx                 | Initials circle, `#1E1E1E` bg, 1px border    |
| `<Stars rating count? size/>`              | ui.jsx                 | Amber stars with tabular count               |
| `<TonnagePicker value onChange/>`          | screens-shipper.jsx    | Horizontal pill scroll, 6 tiers              |
| `<BidCard bid onAccept onCounter onSkip/>` | screens-shipper.jsx    | Core shipper decision unit                   |
| `<LoadCard load onPress/>`                 | screens-driver.jsx     | Core driver browse unit                      |
| `<MarketReferenceWidget route tonnes/>`    | screens-shipper.jsx    | Screen 09 — key differentiator               |
| `<EarningsBar data/>`                      | screens-driver.jsx     | Screen 19 — driver pricing aid               |
| `<CountdownBar expiresAt/>`                | screens-shipper.jsx    | Live amber TTL depletion bar                 |
| `<ImgBox w h label radius/>`               | ui.jsx                 | Striped placeholder → real image             |
| `<ProgressBar pct/>`                       | screens-onboarding.jsx | 2px amber step indicator                     |
| `<Chip variant?>`                          | ui.jsx                 | amber / green / red / blue / default         |
| `<Pill active?>`                           | ui.jsx                 | 999px radius selection pill                  |
| `<Eyebrow/>`                               | ui.jsx                 | 11px, 600 weight, uppercase, letter-spacing  |
| `<BottomSheet snapPoints?>`                | screens-driver.jsx     | Wraps `@gorhom/bottom-sheet`                 |

### Key React Native library decisions

These libraries are required by the designs and must be installed at project setup,
not when first needed.

| Library                        | Why needed                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- |
| `@gorhom/bottom-sheet`         | All bottom sheet interactions (load detail, counter modal, tracking sheet) |
| `react-native-maps`            | MapView with Google Maps provider, dark tile style                         |
| `expo-camera`                  | Cargo loaded photo capture (screen 22), delivery proof (driver)            |
| `react-native-linear-gradient` | Match confirmed amber gradient overlay (screens 12, 20)                    |

### Design rules Claude must follow when writing mobile UI code

- Never hardcode a color value — always reference `Colors` from `theme.ts`
- Never hardcode a font size — always reference `Typography.sizes` from `theme.ts`
- Never hardcode a border radius — always reference `Radius` from `theme.ts`
- Every price, distance, ETA, bid count, and timestamp must have `fontVariant: ['tabular-nums']`
- Minimum touch target is `48` on every pressable element — enforce with `minWidth` and `minHeight`
- No drop shadows anywhere — elevation is background color stepping only
- The accent color `#F5A623` is used exclusively for: primary CTAs, active states, prices on key screens, the TTL bar, and the match confirmed flash. Never use it decoratively.
- The market reference widget (screen 09) and the earnings bar (screen 19) are the two most important competitive differentiators in the UI — implement them exactly as designed, never simplify them

---

---

## API conventions

### Base URL structure

```
/v1/auth/*
/v1/users/*
/v1/jobs/*
/v1/bids/*
/v1/deliveries/*
/v1/messages/*
/v1/subscriptions/*
/v1/ratings/*
/v1/drivers/*
/v1/notifications/*
```

Full API reference: `docs/API.md`

### Response envelope

All API responses use this shape — no exceptions:

```typescript
// Success
{
  success: true,
  data: T,
  meta?: { page, limit, total }  // pagination only
}

// Error
{
  success: false,
  error: {
    code: string,     // e.g. "JOB_NOT_FOUND", "INVALID_TONNAGE"
    message: string,  // human-readable, shown to the user
    details?: unknown // validation errors only
  }
}
```

### Authentication

JWT access token (15 min expiry) + refresh token (30 days).
Access token sent as `Authorization: Bearer <token>` header.
Refresh token sent as `httpOnly` cookie.
Phone number is the only identifier — no email, no username.
OTP delivered via BulkIT SMS.

### Fastify route structure

Each route file exports a Fastify plugin. Group by resource:

```
apps/api/src/
├── routes/
│   ├── auth/
│   │   ├── index.ts       # register sub-routes
│   │   ├── login.ts
│   │   ├── verify-otp.ts
│   │   └── refresh.ts
│   ├── jobs/
│   │   ├── index.ts
│   │   ├── create.ts
│   │   ├── list.ts
│   │   ├── get.ts
│   │   └── cancel.ts
│   ├── bids/
│   ├── deliveries/
│   ├── messages/
│   ├── subscriptions/
│   └── ratings/
├── services/              # Business logic — never in route handlers
│   ├── job.service.ts
│   ├── bid.service.ts
│   ├── matching.service.ts
│   ├── location.service.ts
│   ├── notification.service.ts
│   ├── subscription.service.ts
│   └── paynow.service.ts
├── workers/               # BullMQ workers
│   ├── bid-expiry.worker.ts
│   ├── radius-expansion.worker.ts
│   ├── notification.worker.ts
│   └── subscription-renewal.worker.ts
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── redis.ts           # Redis client singleton
│   ├── socket.ts          # Socket.IO server setup
│   ├── queues.ts          # BullMQ queue definitions
│   ├── s3.ts              # AWS S3 client
│   ├── fcm.ts             # Firebase Admin SDK
│   ├── bulkit.ts
│   ├── paynow.ts
│   └── google-maps.ts
├── middleware/
│   ├── auth.ts            # JWT verification hook
│   ├── driver-only.ts
│   ├── shipper-only.ts
│   └── subscription-active.ts
├── plugins/
│   ├── cors.ts
│   ├── rate-limit.ts
│   └── multipart.ts       # File uploads
└── app.ts                 # Fastify instance + plugin registration
```

---

## Socket.IO event contracts

All Socket.IO events are typed. Import from `packages/types/socket.ts`.

### Namespaces

```
/jobs      — job lifecycle events
/location  — driver GPS updates
/chat      — in-job messaging
```

### Events — /jobs namespace

```typescript
// Server → Client
"job:bid_received"; // new bid arrived on a shipper's posted job
"job:bid_status_updated"; // bid accepted / rejected / countered
"job:matched"; // match confirmed for both parties
"job:status_changed"; // any job status transition
"job:radius_expanded"; // search radius expanded after 60s
"job:expired"; // bidding TTL elapsed, no match

// Client → Server
"job:subscribe"; // join a job's room
"job:unsubscribe"; // leave a job's room
```

### Events — /location namespace

```typescript
// Client → Server (driver sends)
"location:update"; // { lat: number, lng: number, heading?: number, speed?: number }

// Server → Client (shipper receives during active job)
"location:driver"; // { lat, lng, heading, speed, etaSeconds }
```

### Events — /chat namespace

```typescript
// Client → Server
"chat:send"; // { jobId, content?, mediaUrl?, mediaType? }

// Server → Client
"chat:message"; // full Message object
"chat:read"; // { messageId, readAt }
```

---

## BullMQ queues

Queue names are constants — import from `packages/constants/queues.ts`.

| Queue                  | Trigger           | Action                                                                    |
| ---------------------- | ----------------- | ------------------------------------------------------------------------- |
| `bid-expiry`           | Job posted        | After TTL (default 5 min), close bidding, notify shipper if no match      |
| `radius-expansion`     | Job posted        | After 60s with < 3 bids, expand search radius by 15km, notify new drivers |
| `notification`         | Any event         | Send FCM push and/or BulkIT SMS                                           |
| `subscription-renewal` | Daily cron        | Check subscriptions expiring in 24h, charge Paynow, update status         |
| `subscription-expiry`  | Daily cron        | Suspend drivers with expired subscriptions, notify them                   |
| `paynow-poll`          | Payment initiated | Poll Paynow for payment status every 10s for up to 5 min                  |

---

## Matching logic

When a job is posted:

1. Query Redis `GEORADIUS` for online drivers within `searchRadiusKm` (default 25km)
2. Filter by `capacityTonnes >= job.requiredTonnes`
3. Filter by `subscriptionStatus === ACTIVE`
4. Filter by `documentStatus === APPROVED`
5. Send FCM push to all qualifying drivers via `notification` queue
6. Schedule `bid-expiry` job with TTL
7. Schedule `radius-expansion` job for 60 seconds

Radius expansion (option C):

- After 60 seconds, if fewer than 3 bids received:
  - Expand `searchRadiusKm` by 15km
  - Notify new qualifying drivers in the expanded ring only (not drivers already notified)
  - Show shipper a banner: "Expanding search radius…"
  - Repeat every 60 seconds up to 3 expansions (max 70km radius)
  - After 3 expansions with no match, notify shipper to repost with adjusted price

Driver location in Redis:

```
GEOADD loada:drivers:online <lng> <lat> <driverId>
EXPIRE loada:drivers:online:<driverId> 30  // driver considered offline after 30s without ping
```

Bid session state in Redis:

```
loada:job:<jobId>:bids        // sorted set, score = timestamp
loada:job:<jobId>:bid_count   // integer, incremented on each bid
loada:job:<jobId>:status      // string: "open" | "matched" | "expired"
```

---

## Mobile app structure

```
apps/mobile/
├── app/                    # Expo Router file-based routing
│   ├── (auth)/
│   │   ├── index.tsx       # Role selection
│   │   ├── phone.tsx       # Phone entry
│   │   ├── otp.tsx         # OTP verification
│   │   ├── shipper-setup.tsx
│   │   └── driver-setup/
│   │       ├── personal.tsx
│   │       ├── vehicle.tsx
│   │       └── documents.tsx
│   ├── (shipper)/
│   │   ├── _layout.tsx     # Bottom nav (shipper tabs)
│   │   ├── index.tsx       # Shipper home map
│   │   ├── post/
│   │   │   ├── route.tsx
│   │   │   ├── cargo.tsx
│   │   │   ├── pricing.tsx
│   │   │   └── confirm.tsx
│   │   ├── bids/
│   │   │   └── [jobId].tsx # Live bid inbox
│   │   ├── tracking/
│   │   │   └── [jobId].tsx # Active job tracking
│   │   ├── jobs/
│   │   │   └── index.tsx   # Job history
│   │   ├── chat/
│   │   │   └── [jobId].tsx
│   │   └── profile/
│   │       └── index.tsx
│   ├── (driver)/
│   │   ├── _layout.tsx     # Bottom nav (driver tabs)
│   │   ├── index.tsx       # Driver home map
│   │   ├── loads/
│   │   │   ├── index.tsx   # Load list
│   │   │   └── [jobId].tsx # Load detail
│   │   ├── bid/
│   │   │   └── [jobId].tsx # Place / manage bid
│   │   ├── active/
│   │   │   └── [jobId].tsx # En route / delivery flow
│   │   ├── earnings/
│   │   │   └── index.tsx
│   │   ├── documents/
│   │   │   └── index.tsx
│   │   ├── subscription/
│   │   │   └── index.tsx
│   │   ├── chat/
│   │   │   └── [jobId].tsx
│   │   └── profile/
│   │       └── index.tsx
│   └── (shared)/
│       ├── notifications.tsx
│       ├── issue/[jobId].tsx
│       ├── dispute/[jobId].tsx
│       ├── help.tsx
│       ├── settings.tsx
│       └── referral.tsx
├── components/
│   ├── ui/                 # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── TonnagePicker.tsx
│   │   ├── BidCard.tsx
│   │   ├── MapPin.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── Skeleton.tsx
│   │   └── Input.tsx
│   ├── job/
│   ├── driver/
│   └── shared/
├── hooks/
│   ├── useSocket.ts
│   ├── useLocation.ts
│   ├── useAuth.ts
│   └── useJob.ts
├── store/                  # Zustand stores
│   ├── auth.store.ts
│   ├── job.store.ts
│   └── location.store.ts
├── services/               # API client calls
│   ├── api.ts              # Axios instance with auth interceptor
│   ├── job.api.ts
│   ├── bid.api.ts
│   └── auth.api.ts
├── constants/
│   └── theme.ts            # Colors, typography, spacing
└── utils/
```

---

## Design system — constants

All design tokens live in `apps/mobile/constants/theme.ts`. Never hardcode colors or
font sizes in component files. These values are extracted directly from `designs/styles.css`
and verified against all 30 screens in `designs/`. Do not guess or approximate — use
these exact values.

```typescript
export const Colors = {
  background: {
    primary: "#0A0A0A", // --bg        screen background
    card: "#141414", // --card      card surfaces, bottom sheets, tab bar
    elevated: "#1E1E1E", // --elev      inputs, stat strips, secondary surfaces
    divider: "#2A2A2A", // --divider   borders, separators, disabled pill bg
  },
  accent: "#F5A623", // --accent    electric amber — CTAs, active states, prices, TTL bar
  text: {
    primary: "#FFFFFF", // --text
    secondary: "#8A8A8A", // --text-2    labels, secondary info, placeholders
    tertiary: "#4A4A4A", // --text-3    disabled, timestamps, dim icons
  },
  status: {
    green: "#00C853", // --green     confirmed, online, delivered, verified
    amber: "#FFB300", // --amber     warning, document expiring soon
    red: "#F44336", // --red       cancelled, error, safety concern
    blue: "#2196F3", // --blue      refrigerated chip, info states
  },
} as const;

export const Typography = {
  font: "Inter", // confirmed in designs/styles.css — not DM Sans
  weights: {
    light: "300" as const, // timestamps, metadata
    regular: "400" as const, // body copy
    medium: "500" as const, // driver names, card labels
    semibold: "600" as const, // screen headings, button labels, CTAs
    bold: "700" as const, // prices, key numbers, earnings figures
  },
  sizes: {
    heroPrice: 72, // bid input, asking price input — the Bloomberg moment
    largePrice: 48, // weekly earnings total on earnings screen
    price: 32, // load detail asking price, match confirmed agreed price
    heading: 28, // onboarding headings ("What are you here to do?")
    screenTitle: 22, // standard screen headings ("Route", "What are you moving?")
    cardTitle: 18, // card titles, paywall plan labels
    body: 15, // standard body (inputs, card body text)
    bodySmall: 14, // bid card driver name, load card route
    label: 13, // secondary descriptions, chat messages
    chip: 12, // filter pills, sort pills, quick tags
    eyebrow: 11, // section labels (uppercase + letter-spacing)
    micro: 10, // map labels, timestamps, chip inner text
  },
} as const;

export const Spacing = {
  screenH: 20, // horizontal screen padding (left/right on all screens)
  card: 16, // card internal padding
  cardSm: 14, // tight card padding (bid cards, load cards)
  gap: 12, // standard gap between stacked cards
  gapSm: 8, // tight gap (chips, pills, button rows)
  section: 24, // vertical space before section labels
} as const;

export const Radius = {
  pill: 999, // tonnage picker pills, online/offline toggle, avatar
  card: 12, // cards, bottom sheets corners
  button: 8, // primary/ghost/dark buttons, inputs, bid action buttons
  chip: 4, // cargo chips (OVERSIZED, FRAGILE, REFRIGERATED, HAZARDOUS)
  inner: 8, // inner elements inside cards (truck photo, stat strip)
} as const;

export const Components = {
  buttonHeight: 52, // primary, ghost, dark buttons — all same height
  inputHeight: 52, // all text inputs
  pillHeight: 36, // tonnage picker pills, filter sort pills
  chipHeight: 24, // inline cargo/status chips
  appbarHeight: 62, // status bar (44px) + appbar content area
  tabbarHeight: 76, // bottom nav including home indicator space (24px)
  bottomSheetR: 20, // bottom sheet top corner radius
  handleWidth: 36, // bottom sheet drag handle width
  handleHeight: 4, // bottom sheet drag handle height
  avatarBorder: 1, // avatar ring border width
  touchMin: 48, // minimum touch target — drivers use this on bumpy roads
  progressHeight: 2, // progress bar height (post-load steps, bid TTL)
} as const;

export const Shadows = {
  // No drop shadows anywhere in the app.
  // Elevation is communicated through background color stepping:
  // primary (#0A0A0A) → card (#141414) → elevated (#1E1E1E)
  // The only "glow" effect is the focus ring on inputs:
  // box-shadow: 0 0 0 3px rgba(245,166,35,0.08)
  accentFocusRing: "rgba(245, 166, 35, 0.08)",
  accentGlow: "rgba(245, 166, 35, 0.20)", // active bid TTL dot, online toggle
} as const;
```

### Chip variants

Cargo and status chips use these exact background/border/text combos. Never deviate.

```typescript
export const ChipVariants = {
  default: { bg: "#1E1E1E", border: "#2A2A2A", text: "#8A8A8A" },
  amber: {
    bg: "rgba(245,166,35,0.10)",
    border: "rgba(245,166,35,0.25)",
    text: "#F5A623",
  },
  green: {
    bg: "rgba(0,200,83,0.10)",
    border: "rgba(0,200,83,0.25)",
    text: "#00C853",
  },
  red: {
    bg: "rgba(244,67,54,0.10)",
    border: "rgba(244,67,54,0.25)",
    text: "#F44336",
  },
  blue: {
    bg: "rgba(33,150,243,0.10)",
    border: "rgba(33,150,243,0.25)",
    text: "#2196F3",
  },
} as const;
```

### Tabular numbers

Apply `fontVariant: ['tabular-nums']` to every price, distance, ETA, rating count,
bid count, and timestamp in the app. In the designs these elements carry `className="num"`.
In React Native StyleSheet this maps to `fontVariant: ['tabular-nums']`.

### Font feature settings

```typescript
// Apply to the root Text style
fontFeatureSettings: "'cv11', 'ss01'"; // Inter optical size + stylistic alt
```

This is set in `designs/styles.css` on the body element. Apply via a custom Text
component that wraps all text in the app.

---

## Coding standards

### TypeScript

- Strict mode enabled everywhere — `"strict": true` in all `tsconfig.json`
- No `any` types — use `unknown` and narrow, or define proper types
- All shared types live in `packages/types` — never duplicate type definitions across apps
- Enums for all status fields — never raw strings in conditionals

### Async / error handling

- All async route handlers wrapped in try/catch — Fastify's `onError` hook is the fallback, not the primary
- Never swallow errors silently — log with context, then either throw or return a structured error response
- Prisma errors should be caught and mapped to domain errors before reaching the route handler
- `Promise.all` for independent async operations — never sequential awaits when parallelism is safe

### Database

- Never write raw SQL unless PostGIS spatial queries require it — use Prisma everywhere else
- Every query that touches `jobs` or `bids` must filter by `status` — never query without a status filter in production code
- Add database indexes for every foreign key and every field used in `WHERE` clauses — document new indexes in `DECISIONS.md`
- Transactions for any operation that writes to multiple tables — use `prisma.$transaction`

### Redis

- All Redis keys follow the pattern `loada:<resource>:<id>:<field>` — no freeform key naming
- Set TTLs on every key that represents transient state (bid sessions, OTP codes, presence)
- Redis `maxmemory` is set — never assume Redis will hold data indefinitely
- Driver location updates: `GEOADD` only — never store location in PostgreSQL for live tracking

### File uploads

- All uploads go to S3 via presigned URLs — the mobile app uploads directly to S3, not through the API server
- API generates the presigned URL, mobile uploads, then confirms the URL back to the API
- Max file sizes enforced: photos 10MB, documents 20MB, voice notes 5MB
- File names are UUIDs — never use user-provided file names

### Security

- Phone numbers stored hashed in the database — never in plaintext
- OTP codes expire after 10 minutes, single use only
- JWT secrets are long random strings — minimum 64 characters
- All S3 buckets are private — public access blocked at bucket policy level
- Presigned URLs expire after 15 minutes for uploads, 1 hour for downloads
- Driver documents are never publicly accessible — serve via presigned download URLs only
- Rate limit all auth endpoints — OTP endpoint max 3 requests per phone per 10 minutes

### Logging

- Structured JSON logs everywhere — use Fastify's built-in Pino logger
- Log levels: `error` for exceptions, `warn` for recoverable issues, `info` for key business events, `debug` for development only
- Always log: job created, bid placed, match confirmed, delivery completed, subscription renewed, subscription expired
- Never log: phone numbers, JWT tokens, payment credentials, OTP codes

---

## Key business rules — enforce in service layer, not route handlers

1. A driver cannot bid on a job if their subscription is not `ACTIVE`
2. A driver cannot bid on a job if their documents are not `APPROVED`
3. A driver cannot bid on a job if their registered `capacityTonnes` is less than `job.requiredTonnes`
4. A driver cannot have more than 3 active bids simultaneously
5. A shipper cannot post a new job if they have a job in `MATCHED` through `IN_TRANSIT` status — one active job at a time per shipper (MVP)
6. Bids cannot be placed after `job.biddingExpiresAt`
7. A match cannot be confirmed on a cancelled or expired job
8. Proof of delivery photo is required before a job can move to `DELIVERED` status
9. Both parties must rate each other — ratings are prompted but not enforced (optional)
10. Subscription fee deduction is logged in `SubscriptionPayment` regardless of success or failure — failed payments are retried once after 24 hours before suspension

---

## Paynow integration notes

Paynow uses a polling model — not webhooks. When a payment is initiated:

1. API calls Paynow to create a payment request
2. Paynow returns a `pollUrl` and redirects user to payment page
3. API schedules a `paynow-poll` BullMQ job that hits `pollUrl` every 10 seconds
4. On `PAID` status: update subscription, cancel polling job, notify driver
5. On timeout (5 minutes): mark payment as failed, notify driver to retry
6. Never block the API response waiting for Paynow — always async via the queue

EcoCash flow: Paynow sends an STK push to the driver's phone. Driver confirms on their phone. Poll detects the confirmation. This is the primary payment flow in Zimbabwe.

---

## Google Maps API — minimize calls

Google Maps is billed per call. Minimize usage:

- Cache geocoding results in Redis for 7 days — same address string → same coordinates
- Use Distance Matrix API only for the job posting confirmation screen — not for every GPS update
- ETAs during active jobs are calculated server-side using the driver's live GPS + Directions API, cached and updated every 30 seconds only
- Places Autocomplete: debounce at 300ms on the client, never call on every keystroke
- Log all Google Maps API call counts in Grafana — set billing alerts at $50 increments

---

## BulkIT SMS notes

SMS is the fallback when FCM push fails (app in background on low-end Android,
or user has notifications disabled).

Send SMS for: OTP, match confirmed, delivery completed, subscription expiring in 24h,
subscription expired.
Do not send SMS for: bid received (too frequent, use push only), location updates,
chat messages.

BulkIT is integrated via a custom webhook. The webhook configuration (URL, auth header,
payload format) is handled separately — do not hardcode it in application code.
The SMS lib (`src/lib/bulkit.ts`) reads from environment variables and the delivery
report webhook is registered in the BulkIT dashboard, not in this codebase.

The `sendSMS` function in `src/lib/bulkit.ts` is the single call site for all SMS
in the application. If the BulkIT webhook config changes, only that file changes.
Never call BulkIT directly from service files — always go through `sendSMS`.

---

## Admin panel (`apps/admin/`)

A Next.js 14 web application for platform administrators. Runs on port 3001 in development.

### Authentication

- Username/password login via `POST /v1/admin/auth/login`
- Returns a JWT with `type: "admin"` and 8-hour expiry, signed with `ADMIN_JWT_SECRET`
- Token stored in `localStorage` — refreshes on page load, redirects to `/login` on 401
- Default seed credentials: `admin` / `changeme123` — **change immediately in production**

### Pages

| Route | Purpose |
|---|---|
| `/login` | Username + password login form |
| `/dashboard` | Overview stats (users, drivers, jobs, revenue, pending docs) |
| `/dashboard/config` | Edit all 22 AppConfig keys — grouped by pricing / bidding / matching / auth / payments / market |
| `/dashboard/users` | Paginated user list with suspend / unsuspend actions |
| `/dashboard/drivers` | Driver list with document approve / reject, subscription status |
| `/dashboard/jobs` | Job list with force-cancel action |
| `/dashboard/subscriptions` | Subscription list with status override and period-end override |

### Config system

All operational constants live in the `AppConfig` database table (key-value). They are:
- Cached in Redis for 60 seconds (`loada:config:<key>`)
- Read via `getConfigNum(key)` / `getConfig(key)` in service files
- Written via the admin panel or `setConfig(key, value, adminUsername)`
- Seeded with defaults on `npm run db:seed`

The 22 configurable keys are defined in `apps/api/src/lib/app-config.ts` as `ConfigKey`.
Never hardcode these values in service files — always read from config.

### Running locally

```bash
# Start the API (required — admin panel proxies to it)
cd apps/api && npm run dev

# Start the admin panel
cd apps/admin && npm run dev
# Open http://localhost:3002
```

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | CSS Modules + global CSS variables (no Tailwind) |
| Auth | localStorage JWT + redirect guard in layout |
| API calls | Fetch with Bearer token, auto-redirect on 401 |

---

## Deployment — MVP

Single EC2 `t3.medium` running:

- Fastify API server + Socket.IO (PM2, **1 instance**, fork mode — Socket.IO is attached to the same http.Server; cluster mode requires a Redis adapter and nginx `ip_hash` which is out of scope for MVP)
- Admin panel — Next.js (PM2, 1 instance, fork mode)
- BullMQ workers (PM2, 1 instance per queue — see `ecosystem.config.js`)
- Redis (systemd service, not PM2)

### Ports

| Process | Port | External URL |
|---|---|---|
| API (Fastify + Socket.IO) | 3000 | `api.loada.app` |
| Admin panel (Next.js) | 3001 | `admin.loada.app` |
| Mobile Expo Metro (dev only) | 8081 | — |

### NGINX

Full config at `docs/nginx.conf`. Key routing:

- `api.loada.app/*` → `127.0.0.1:3000` (API)
- `socket.loada.app/socket.io/*` → `127.0.0.1:3000` (Socket.IO, same process as API)
- `admin.loada.app/*` → `127.0.0.1:3001` (admin panel)
- Static assets → S3 via CloudFront (not served from EC2)

Cloudflare: DNS-only mode (grey cloud) for `socket.loada.app` to avoid WebSocket proxying issues.
Optionally restrict `admin.loada.app` by IP in nginx (`allow/deny`) — see comments in `docs/nginx.conf`.

### Redis config (`/etc/redis/redis.conf`)

```
maxmemory 256mb
maxmemory-policy allkeys-lru
save ""  # disable persistence — transient cache only, jobs data is in Postgres
```

### PM2

Ecosystem file at repo root: `ecosystem.config.js` — covers both `loada-api` and `loada-admin` processes.
Use `pm2 save` and `pm2 startup` after any config change.

### DNS records

| Subdomain | Cloudflare proxy | Points to |
|---|---|---|
| `api.loada.app` | ✓ Orange cloud | EC2 public IP |
| `admin.loada.app` | ✓ Orange cloud | EC2 public IP |
| `socket.loada.app` | ✗ Grey cloud (DNS-only) | EC2 public IP |

---

## When to update this file

Update `CLAUDE.md` when:

- A new technology is added to the stack
- A new environment variable is required
- A new queue is added
- A business rule changes
- A new table or significant schema change is made
- A deployment configuration changes

Update `docs/DECISIONS.md` when making any architectural choice that isn't obvious — record what was decided, why, and what alternatives were rejected.

Update `docs/DESIGN_AUDIT.md` when new screens are designed, existing screens change significantly, or new components are extracted. The audit is a living document — keep the missing screens list current as designs are completed.

---

## What Claude should never do in this codebase

- Never use `any` in TypeScript
- Never write raw SQL except for PostGIS spatial queries
- Never store sensitive data (phone numbers, tokens) in plaintext
- Never call Google Maps API without checking the Redis cache first
- Never put business logic in route handlers — it belongs in service files
- Never commit `.env` files — only `.env.example`
- Never use string literals for job statuses or tonnage values — use the enums and constants
- Never add a new npm package without checking if the functionality already exists in the codebase
- Never deploy without running `npx prisma migrate deploy` on the target database first
- Never merge a PR that removes error handling from an async function
- Never hardcode a color, font size, radius, or spacing value in a component — always use `theme.ts`
- Never simplify the market reference widget or the driver earnings bar — they are the core product differentiators
- Never build a screen without first checking `designs/index.html` for the reference design
- Never use a drop shadow in the mobile UI — elevation is background color stepping only
- Never omit `fontVariant: ['tabular-nums']` from prices, distances, ETAs, counts, and timestamps
