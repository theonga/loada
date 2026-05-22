# Loada Backend — Claude Code Prompt

## Complete API, Realtime, Queue & Infrastructure Setup

---

## CRITICAL: Progress tracking — read this before starting and after every interruption

You are working on a large multi-step task. Context windows have limits. Compaction happens.
You must protect your own progress at all times.

**Before starting any step:**

- Write a `PROGRESS.md` file in `apps/api/` and keep it updated throughout
- Every time you complete a step or a significant sub-task, update `PROGRESS.md` immediately
- Never assume you will remember where you were — write it down

**`PROGRESS.md` format:**

```markdown
# Loada API — Build Progress

Last updated: [timestamp]

## Status

Current step: [step number and name]
Current sub-task: [exact thing being worked on right now]

## Completed steps

- [x] Step 1 — Project setup
- [x] Step 2 — Database & Prisma
- [ ] Step 3 — Core infrastructure (IN PROGRESS)
      ...

## Completed routes

- [x] POST /api/v1/auth/send-otp
- [x] POST /api/v1/auth/verify-otp
- [ ] POST /api/v1/auth/refresh (IN PROGRESS)
      ...

## Completed services

- [x] auth.service.ts
- [ ] job.service.ts (IN PROGRESS)
      ...

## Completed workers

- [ ] bid-expiry.worker.ts
      ...

## Blockers / decisions made

- [decision 1]

## Next action

[Single sentence: exactly what to do next]
```

**After any interruption or compaction:**

- Read `PROGRESS.md` first — before reading anything else
- Resume exactly from "Next action"
- Do not restart from the beginning
- Do not re-do completed steps

**If you are ever unsure where you are:**

- Read `PROGRESS.md`
- Read `CLAUDE.md`
- Continue from where `PROGRESS.md` says — never guess

**Step completion rule:**
A step is only marked complete when every item in that step is done and verified.
"Mostly done" is not done. Mark partial steps as `(IN PROGRESS)` with a note on
what remains.

---

## Your task

You are building the complete Loada backend. Read `CLAUDE.md` in full before writing
a single line of code. Everything in that file is law — stack choices, folder structure,
API conventions, data model, business rules, queue names, Socket.IO event contracts,
and the never-do list at the bottom.

Build the full production-ready API, realtime layer, queue system, and worker processes.
By the end of this task the backend must be runnable with `npm run dev` and every
endpoint must return correct responses, either from the database or with clear error
messages.

---

## Step 1 — Project setup

Initialize the API app inside `apps/api/` with Node.js + TypeScript:

```bash
mkdir -p apps/api/src
cd apps/api
npm init -y
```

Install all dependencies:

```bash
# Core
npm install fastify @fastify/cors @fastify/jwt @fastify/multipart @fastify/rate-limit
npm install @fastify/cookie @fastify/helmet

# Database
npm install @prisma/client
npm install -D prisma

# Realtime
npm install socket.io

# Queue
npm install bullmq ioredis

# AWS
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Firebase Admin (FCM)
npm install firebase-admin

# SMS — BulkIT (no npm package — plain HTTP via axios, already installed)

# Google Maps
npm install @googlemaps/google-maps-services-js

# Utilities
npm install zod bcryptjs uuid dayjs axios
npm install -D typescript ts-node nodemon @types/node @types/bcryptjs @types/uuid

# Monitoring
npm install @sentry/node
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Create `package.json` scripts:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

Create `nodemon.json`:

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node src/server.ts"
}
```

Create `.env.example` with every variable from `CLAUDE.md` under
"API environment variables". Create `.env` with placeholder values for local dev.
Add `.env` to `.gitignore`.

Update `PROGRESS.md` when done.

---

## Step 2 — Database & Prisma

Copy the complete Prisma schema from `CLAUDE.md` into `prisma/schema.prisma`.
The schema is the source of truth — do not modify it, do not add fields, do not
remove fields. Copy it exactly.

Configure the datasource:

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [postgis]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}
```

Run:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Create `src/lib/prisma.ts` — Prisma client singleton:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Create `prisma/seed.ts` — seeds the database with realistic Zimbabwean test data
matching the mock data structure from the mobile app. Use the same driver names,
routes, truck models, and job scenarios defined in the mobile prompt's Step 3.
The seed must create:

- 2 shipper users + profiles
- 8 driver users + profiles (all with APPROVED documents)
- 1 active subscription per driver
- 6 jobs in different statuses
- Bids against the BIDDING job (4 bids, different prices)
- 1 realistic chat thread (6 messages)
- Ratings for the COMPLETED job

Run `npm run db:seed` to verify it works before continuing.

Update `PROGRESS.md` when done.

---

## Step 3 — Core infrastructure

Build all shared infrastructure before writing any routes. These are the files
everything else depends on.

Update `PROGRESS.md` after each file.

**`src/lib/redis.ts`** — Redis client singleton using ioredis:

```typescript
import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});
```

**`src/lib/queues.ts`** — BullMQ queue definitions. Queue names as constants —
never hardcode queue name strings anywhere else in the codebase:

```typescript
import { Queue } from "bullmq";
import { redis } from "./redis";

const connection = { connection: redis };

export const QUEUE_NAMES = {
  BID_EXPIRY: "bid-expiry",
  RADIUS_EXPANSION: "radius-expansion",
  NOTIFICATION: "notification",
  SUBSCRIPTION_RENEWAL: "subscription-renewal",
  SUBSCRIPTION_EXPIRY: "subscription-expiry",
  PAYNOW_POLL: "paynow-poll",
} as const;

export const bidExpiryQueue = new Queue(QUEUE_NAMES.BID_EXPIRY, connection);
export const radiusExpansionQueue = new Queue(
  QUEUE_NAMES.RADIUS_EXPANSION,
  connection,
);
export const notificationQueue = new Queue(
  QUEUE_NAMES.NOTIFICATION,
  connection,
);
export const subscriptionRenewalQueue = new Queue(
  QUEUE_NAMES.SUBSCRIPTION_RENEWAL,
  connection,
);
export const subscriptionExpiryQueue = new Queue(
  QUEUE_NAMES.SUBSCRIPTION_EXPIRY,
  connection,
);
export const paynowPollQueue = new Queue(QUEUE_NAMES.PAYNOW_POLL, connection);
```

**`src/lib/socket.ts`** — Socket.IO server setup with three namespaces:

```typescript
import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const jobsNs = io.of("/jobs");
  const locationNs = io.of("/location");
  const chatNs = io.of("/chat");

  // /jobs namespace
  jobsNs.on("connection", (socket) => {
    socket.on("job:subscribe", ({ jobId }) => socket.join(`job:${jobId}`));
    socket.on("job:unsubscribe", ({ jobId }) => socket.leave(`job:${jobId}`));
  });

  // /location namespace
  locationNs.on("connection", (socket) => {
    socket.on("location:update", async (data) => {
      // handled in location service — emit to shipper tracking room
    });
  });

  // /chat namespace
  chatNs.on("connection", (socket) => {
    socket.on("chat:send", async (data) => {
      // handled in message service
    });
  });

  return { io, jobsNs, locationNs, chatNs };
}

// Singleton accessor — set after server init
let _io: ReturnType<typeof createSocketServer> | null = null;
export const setSocketServer = (s: ReturnType<typeof createSocketServer>) => {
  _io = s;
};
export const getSocketServer = () => {
  if (!_io) throw new Error("Socket server not initialized");
  return _io;
};
```

**`src/lib/s3.ts`** — AWS S3 client + presigned URL helpers:

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getUploadPresignedUrl(
  folder: "delivery" | "documents" | "trucks" | "chat",
  mimeType: string,
): Promise<{ uploadUrl: string; fileKey: string }> {
  const fileKey = `${folder}/${uuid()}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
    ContentType: mimeType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 }); // 15 min
  return { uploadUrl, fileKey };
}

export async function getDownloadPresignedUrl(
  fileKey: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
}
```

**`src/lib/fcm.ts`** — Firebase Admin SDK for push notifications:

```typescript
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    }),
  });
}

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  await admin
    .messaging()
    .send({ token: fcmToken, notification: { title, body }, data });
}
```

**`src/lib/bulkit.ts`** — SMS via BulkIT. Uses plain HTTP (axios already installed —
no additional package needed). The webhook delivery report endpoint is stubbed and
will be configured separately — do not wire it now.

```typescript
import axios from "axios";

// BulkIT sends SMS via a simple HTTP POST to their gateway.
// Payload format and endpoint may vary — the sendSMS function is the single
// call site. When BulkIT webhook config is ready, only this file changes.

export async function sendSMS(to: string, message: string): Promise<void> {
  if (!process.env.BULKIT_API_KEY) {
    // Graceful no-op in dev when key is not configured
    console.warn(`[SMS stub] To: ${to} | Message: ${message}`);
    return;
  }

  try {
    await axios.post(
      "https://bulkit.app/api/sms/send", // confirm exact endpoint with BulkIT docs
      {
        apiKey: process.env.BULKIT_API_KEY,
        senderId: process.env.BULKIT_SENDER_ID ?? "LOADA",
        to,
        message,
      },
      { timeout: 8000 },
    );
  } catch (err) {
    // SMS failure must never crash the application — log and continue
    console.error(`[BulkIT] SMS failed to ${to}:`, err);
  }
}

// Delivery report webhook — stubbed, to be configured later
// POST /api/v1/sms/webhook
// Verify using process.env.BULKIT_WEBHOOK_SECRET
// Log delivery status per message reference
export async function handleDeliveryReport(payload: unknown): Promise<void> {
  // TODO: implement when BulkIT webhook config is provided
  console.log("[BulkIT] Delivery report received:", JSON.stringify(payload));
}
```

Add a stub route for the delivery report webhook in `src/routes/sms/index.ts`:

```typescript
import type { FastifyInstance } from "fastify";
import { handleDeliveryReport } from "@/lib/bulkit";

export async function smsRoutes(app: FastifyInstance) {
  app.post("/webhook", async (req, reply) => {
    // Verify webhook secret when BulkIT config is provided
    const secret = req.headers["x-bulkit-secret"];
    if (
      process.env.BULKIT_WEBHOOK_SECRET &&
      secret !== process.env.BULKIT_WEBHOOK_SECRET
    ) {
      return reply.status(401).send({ success: false });
    }
    await handleDeliveryReport(req.body);
    return reply.send({ success: true });
  });
}
```

Register this route in `app.ts`:

```typescript
await app.register(smsRoutes, { prefix: "/api/v1/sms" });
```

This endpoint is live but the implementation is a stub. When BulkIT webhook
configuration is provided, only `handleDeliveryReport` in `bulkit.ts` needs updating.

**`src/lib/google-maps.ts`** — Google Maps client with Redis caching:

```typescript
import { Client, TravelMode } from "@googlemaps/google-maps-services-js";
import { redis } from "./redis";

const mapsClient = new Client({});

export async function geocode(
  address: string,
): Promise<{ lat: number; lng: number }> {
  const cacheKey = `loada:geocode:${Buffer.from(address).toString("base64")}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const res = await mapsClient.geocode({
    params: { address, key: process.env.GOOGLE_MAPS_API_KEY! },
  });
  const location = res.data.results[0].geometry.location;
  const result = { lat: location.lat, lng: location.lng };

  await redis.setex(cacheKey, 604800, JSON.stringify(result)); // 7 days
  return result;
}

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ distanceM: number; durationS: number }> {
  const res = await mapsClient.directions({
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: TravelMode.driving,
      key: process.env.GOOGLE_MAPS_API_KEY!,
    },
  });
  const leg = res.data.routes[0].legs[0];
  return {
    distanceM: leg.distance.value,
    durationS: leg.duration.value,
  };
}
```

**`src/lib/paynow.ts`** — Paynow integration (polling model — no webhooks):

```typescript
import axios from "axios";
import crypto from "crypto";

function generateHash(values: string[], integrationKey: string): string {
  const str = values.join("") + integrationKey;
  return crypto.createHash("sha512").update(str).digest("hex").toUpperCase();
}

export async function initiatePayment(params: {
  reference: string;
  amount: number;
  phone: string;
  description: string;
}): Promise<{ pollUrl: string; redirectUrl: string }> {
  // Paynow mobile payment initiation
  const fields = {
    id: process.env.PAYNOW_INTEGRATION_ID!,
    reference: params.reference,
    amount: params.amount.toFixed(2),
    additionalinfo: params.description,
    authemail: "",
    phone: params.phone,
    method: "ecocash",
    returnurl: "https://loada.app/payment/return",
    resulturl: "https://loada.app/payment/result",
    status: "Message",
  };
  const hash = generateHash(
    Object.values(fields),
    process.env.PAYNOW_INTEGRATION_KEY!,
  );
  const res = await axios.post(
    "https://www.paynow.co.zw/interface/remotetransaction",
    new URLSearchParams({ ...fields, hash }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  const data = Object.fromEntries(new URLSearchParams(res.data));
  if (data.status !== "Ok") throw new Error(`Paynow error: ${data.error}`);
  return { pollUrl: data.pollurl, redirectUrl: data.browserurl };
}

export async function pollPayment(pollUrl: string): Promise<{
  status: "PAID" | "PENDING" | "FAILED" | "CANCELLED";
  paynowRef?: string;
}> {
  const res = await axios.post(pollUrl);
  const data = Object.fromEntries(new URLSearchParams(res.data));
  if (data.status === "Paid")
    return { status: "PAID", paynowRef: data.paynowreference };
  if (data.status === "Cancelled") return { status: "CANCELLED" };
  if (data.status === "Failed") return { status: "FAILED" };
  return { status: "PENDING" };
}
```

**`src/middleware/auth.ts`** — JWT verification Fastify hook:

```typescript
import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma";

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    const payload = req.user as { userId: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user || user.isSuspended) {
      return reply
        .status(401)
        .send({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Unauthorized" },
        });
    }
    req.user = { ...payload, user };
  } catch {
    return reply
      .status(401)
      .send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Unauthorized" },
      });
  }
}

export async function requireDriver(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if ((req.user as any).role !== "DRIVER") {
    return reply
      .status(403)
      .send({
        success: false,
        error: { code: "FORBIDDEN", message: "Driver access required" },
      });
  }
}

export async function requireShipper(req: FastifyRequest, reply: FastifyReply) {
  await requireAuth(req, reply);
  if (
    (req.user as any).role !== "SHIPPER" &&
    (req.user as any).role !== "BOTH"
  ) {
    return reply
      .status(403)
      .send({
        success: false,
        error: { code: "FORBIDDEN", message: "Shipper access required" },
      });
  }
}

export async function requireActiveSubscription(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const driver = (req.user as any).user;
  const sub = await prisma.subscription.findUnique({
    where: { driverId: driver.driverProfile?.id },
  });
  if (!sub || !["ACTIVE", "TRIAL"].includes(sub.status)) {
    return reply.status(403).send({
      success: false,
      error: {
        code: "SUBSCRIPTION_REQUIRED",
        message: "Active subscription required to access loads",
      },
    });
  }
}
```

**`src/app.ts`** — Fastify instance creation and plugin registration:

```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import * as Sentry from "@sentry/node";

import { authRoutes } from "@/routes/auth";
import { jobRoutes } from "@/routes/jobs";
import { bidRoutes } from "@/routes/bids";
import { deliveryRoutes } from "@/routes/deliveries";
import { messageRoutes } from "@/routes/messages";
import { subscriptionRoutes } from "@/routes/subscriptions";
import { ratingRoutes } from "@/routes/ratings";
import { driverRoutes } from "@/routes/drivers";
import { notificationRoutes } from "@/routes/notifications";

export async function buildApp() {
  const app = Fastify({
    logger: { level: process.env.NODE_ENV === "production" ? "info" : "debug" },
  });

  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });

  await app.register(helmet);
  await app.register(cors, { origin: true });
  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: "15m" },
  });
  await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  // Response envelope
  app.addHook("onSend", async (req, reply, payload) => {
    if (reply.statusCode >= 400) return payload;
    if (typeof payload === "string") {
      try {
        JSON.parse(payload);
        return payload;
      } catch {
        return payload;
      }
    }
    return payload;
  });

  // Global error handler
  app.setErrorHandler((error, req, reply) => {
    app.log.error(error);
    Sentry.captureException(error);
    reply.status(error.statusCode ?? 500).send({
      success: false,
      error: {
        code: error.code ?? "INTERNAL_ERROR",
        message: error.message ?? "An unexpected error occurred",
      },
    });
  });

  // Routes
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(jobRoutes, { prefix: "/api/v1/jobs" });
  await app.register(bidRoutes, { prefix: "/api/v1/bids" });
  await app.register(deliveryRoutes, { prefix: "/api/v1/deliveries" });
  await app.register(messageRoutes, { prefix: "/api/v1/messages" });
  await app.register(subscriptionRoutes, { prefix: "/api/v1/subscriptions" });
  await app.register(ratingRoutes, { prefix: "/api/v1/ratings" });
  await app.register(driverRoutes, { prefix: "/api/v1/drivers" });
  await app.register(notificationRoutes, { prefix: "/api/v1/notifications" });

  // Health check
  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}
```

**`src/server.ts`** — entry point, starts HTTP + Socket.IO:

```typescript
import { buildApp } from "./app";
import { createSocketServer, setSocketServer } from "./lib/socket";
import { startWorkers } from "./workers";
import http from "http";

async function main() {
  const app = await buildApp();
  const httpServer = http.createServer(app.server);
  const socketServer = createSocketServer(httpServer);
  setSocketServer(socketServer);

  await startWorkers();

  const port = Number(process.env.PORT ?? 3000);
  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Loada API running on port ${port}`);
  });
}

main().catch(console.error);
```

Update `PROGRESS.md` when every lib file and middleware file is complete.

---

## Step 4 — Service layer

Build all service files before building route handlers. Business logic belongs here —
never in route files. Route files only validate input, call services, and return
the response envelope.

Update `PROGRESS.md` after each service file.

**`src/services/auth.service.ts`**

```typescript
// Functions to implement:
export async function generateAndSendOTP(phone: string): Promise<void>;
// - Generate a 6-digit code
// - Store in Redis: loada:otp:<phone> with 10 min TTL
// - Send via BulkIT SMS (sendSMS from lib/bulkit.ts)
// - Never log the OTP code

export async function verifyOTPAndLogin(
  phone: string,
  code: string,
): Promise<{
  user: User;
  accessToken: string;
  refreshToken: string;
}>;
// - Get OTP from Redis
// - Compare (single use — delete immediately after reading)
// - If no user exists for phone, create one (first login = registration)
// - Generate JWT access token (15 min) + refresh token (30 days)
// - Store refresh token hash in Redis: loada:refresh:<userId>
// - Return user + tokens

export async function refreshTokens(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}>;

export async function logout(userId: string): Promise<void>;
// - Delete refresh token from Redis
```

**`src/services/location.service.ts`**

```typescript
export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number,
): Promise<void>;
// - GEOADD loada:drivers:online <lng> <lat> <driverId>
// - SET loada:driver:<driverId>:location JSON with 30s TTL
// - Update driverProfile.lastLocationLat/Lng/At in Postgres (every 30s max — debounce)
// - Emit location:driver event to the shipper's tracking room if driver has active job

export async function getNearbyDrivers(
  lat: number,
  lng: number,
  radiusKm: number,
  requiredTonnes: number,
): Promise<DriverProfile[]>;
// - GEORADIUS loada:drivers:online <lng> <lat> <radiusKm> km
// - Filter by capacityTonnes >= requiredTonnes
// - Filter by subscriptionStatus ACTIVE
// - Filter by documentStatus APPROVED
// - Return hydrated DriverProfile objects

export async function setDriverOnline(driverId: string): Promise<void>;
export async function setDriverOffline(driverId: string): Promise<void>;
// - ZREM loada:drivers:online <driverId> for offline
```

**`src/services/job.service.ts`**

```typescript
export async function createJob(
  shipperId: string,
  data: CreateJobInput,
): Promise<Job>;
// - Validate shipper has no active job (MATCHED through IN_TRANSIT)
// - Create job in Postgres with status POSTED
// - Schedule bid-expiry BullMQ job with BID_TTL_SECONDS delay
// - Schedule radius-expansion BullMQ job with RADIUS_EXPANSION_SECONDS delay
// - Trigger driver notifications via notification queue
// - Return created job

export async function getAvailableLoads(
  driverId: string,
  lat: number,
  lng: number,
): Promise<Job[]>;
// - Get driver profile (check subscription + documents)
// - Query jobs with status POSTED or BIDDING
// - Filter by requiredTonnes <= driver.capacityTonnes
// - Filter by distance using PostGIS ST_Distance
// - Order by distance ASC
// - Return with bid count per job

export async function getJobById(jobId: string): Promise<Job>;
export async function cancelJob(jobId: string, userId: string): Promise<void>;
export async function getShipperJobs(shipperId: string): Promise<Job[]>;

export async function transitionJobStatus(
  jobId: string,
  newStatus: JobStatus,
): Promise<Job>;
// - Validate the transition is legal per the status machine
// - Update in Postgres
// - Emit job:status_changed via Socket.IO to the job room
// - Log the transition
```

**`src/services/bid.service.ts`**

```typescript
export async function placeBid(
  jobId: string,
  driverId: string,
  offeredPrice: number,
): Promise<Bid>;
// Enforce ALL business rules from CLAUDE.md:
// - Driver subscription must be ACTIVE
// - Driver documents must be APPROVED
// - Driver capacityTonnes >= job.requiredTonnes
// - Driver has < MAX_ACTIVE_BIDS active bids
// - job.biddingExpiresAt has not passed
// - Job status must be POSTED or BIDDING
// - Create bid in Postgres
// - Increment loada:job:<jobId>:bid_count in Redis
// - Transition job to BIDDING if still POSTED
// - Emit job:bid_received to shipper via Socket.IO job room
// - Return created bid

export async function acceptBid(bidId: string, shipperId: string): Promise<Job>;
// - Validate job belongs to shipper
// - Validate job is still in BIDDING status
// - Set winning bid to ACCEPTED
// - Set all other bids on the job to REJECTED
// - Transition job to MATCHED
// - Set job.matchedDriverId and job.matchedBidId
// - Cancel the bid-expiry queue job
// - Emit job:matched to both driver and shipper rooms
// - Send push notification to driver
// - Send SMS to driver (match confirmed)
// - Return updated job

export async function counterBid(
  bidId: string,
  userId: string,
  newPrice: number,
): Promise<Bid>;
// - Can be called by shipper (countering driver's bid) or driver (countering shipper's counter)
// - Update bid offeredPrice
// - Set bid status to COUNTERED
// - Emit job:bid_status_updated to the other party
// - Return updated bid

export async function getJobBids(jobId: string): Promise<Bid[]>;
// - Return all bids for job ordered by offeredPrice ASC
// - Include driver profile with each bid (name, rating, truck, photo)
```

**`src/services/matching.service.ts`**

```typescript
export async function expandSearchRadius(jobId: string): Promise<void>;
// Called by the radius-expansion BullMQ worker
// - Get job from Postgres
// - If fewer than 3 bids and job still BIDDING/POSTED:
//   - Increment searchRadiusKm by RADIUS_EXPANSION_KM
//   - Update job in Postgres
//   - Get drivers in the new ring only (between old radius and new radius)
//   - Send push notifications to new drivers only
//   - Emit job:radius_expanded to shipper room
//   - Schedule another radius-expansion job if expansions < MAX_RADIUS_EXPANSIONS
// - If MAX_RADIUS_EXPANSIONS reached with no match:
//   - Notify shipper to repost with adjusted price

export async function expireBiddingSession(jobId: string): Promise<void>;
// Called by bid-expiry BullMQ worker after TTL
// - If job still has no match (status POSTED or BIDDING):
//   - Transition to POSTED (reset for repost)
//   - Emit job:expired to shipper room
//   - Send push notification to shipper
```

**`src/services/notification.service.ts`**

```typescript
export async function notifyNearbyDrivers(job: Job): Promise<void>;
// - Get nearby drivers via location.service.getNearbyDrivers
// - For each driver: send FCM push via fcm.ts
// - Falls back to SMS for drivers without FCM token

export async function notifyDriver(
  driverId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void>;

export async function notifyShipper(
  shipperId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void>;

// Notification templates — use these exact copy strings:
// Match confirmed (driver):  "You got the load! Head to pickup in [ETA] min."
// Match confirmed (shipper): "[DriverName] is on the way. ETA [N] min."
// Bid received:              "New bid: $[price] from [DriverName] for your [route] load."
// Delivery confirmed:        "Your load has been delivered. Download your POD."
// Subscription expiring:     "Your Loada subscription expires in 24 hours. Renew to keep access."
// Subscription expired:      "Your subscription has expired. Renew to access loads."
```

**`src/services/subscription.service.ts`**

```typescript
export async function createSubscription(
  driverId: string,
  plan: SubscriptionPlan,
  phone: string,
): Promise<{ subscription: Subscription; pollUrl: string }>;
// - Create subscription record with status PENDING
// - Initiate Paynow payment
// - Schedule paynow-poll BullMQ job
// - Return subscription + redirectUrl for mobile to show payment page

export async function handlePaymentConfirmed(
  subscriptionId: string,
  paynowRef: string,
): Promise<void>;
// Called by paynow-poll worker on PAID status
// - Set subscription status to ACTIVE
// - Set currentPeriodEnd based on plan:
//   WEEKLY: +7 days, MONTHLY: +30 days, ANNUAL: +365 days
// - Create SubscriptionPayment record
// - Send confirmation push + SMS to driver
// - Enable driver's access (documentStatus check separately)

export async function renewSubscription(subscriptionId: string): Promise<void>;
// Called by subscription-renewal worker

export async function suspendExpiredDrivers(): Promise<void>;
// Called by subscription-expiry worker daily
// - Find subscriptions where currentPeriodEnd < now and status ACTIVE
// - Set status EXPIRED
// - Send push + SMS warning to driver
```

**`src/services/delivery.service.ts`**

```typescript
export async function confirmPickup(
  jobId: string,
  driverId: string,
  photoUri: string,
  discrepancyNote?: string,
): Promise<void>;
// - Validate job is in PICKUP_ARRIVED status
// - Create/update Delivery record with pickupConfirmedAt + pickupPhotoUrl
// - Transition job to LOADED
// - Notify shipper: "Your cargo is loaded. [DriverName] is heading to [destination]."
// - Emit job:status_changed

export async function confirmDelivery(
  jobId: string,
  driverId: string,
  photoUri: string,
  recipientName: string,
  signatureUri?: string,
  lat?: number,
  lng?: number,
): Promise<void>;
// - Validate job is IN_TRANSIT
// - Update Delivery record with all delivery fields + GPS stamp
// - Transition job to DELIVERED
// - Notify shipper: "Delivered. Download your proof of delivery."
// - Emit job:status_changed

export async function getPOD(jobId: string): Promise<PODData>;
// - Return full delivery record with presigned download URLs for photos
```

**`src/services/rating.service.ts`**

```typescript
export async function submitRating(
  jobId: string,
  fromUserId: string,
  toUserId: string,
  score: number,
  tags: string[],
  comment?: string,
): Promise<void>;
// - Validate job is DELIVERED or COMPLETED
// - Validate fromUser was a party to the job
// - Validate rating not already submitted for this direction
// - Create Rating record
// - If both parties have rated: transition job to COMPLETED
// - Recalculate toUser's aggregate rating (average of all ratings received)

export async function getUserAggregateRating(userId: string): Promise<{
  average: number;
  count: number;
}>;
```

Update `PROGRESS.md` after each service is complete.

---

## Step 5 — Route handlers

Build every route file. Each route file is a Fastify plugin. Route handlers do
three things only: validate input with Zod, call the service, return the envelope.
No business logic in route handlers.

Response envelope for every successful response:

```typescript
{ success: true, data: T }
```

Response envelope for every error:

```typescript
{ success: false, error: { code: string, message: string, details?: unknown } }
```

Update `PROGRESS.md` after each route file.

**`src/routes/auth/index.ts`**

```
POST /api/v1/auth/send-otp
  Body: { phone: string }
  Rate limited: 3 requests per phone per 10 minutes
  Response: { success: true, data: { message: 'OTP sent' } }

POST /api/v1/auth/verify-otp
  Body: { phone: string, code: string, role: 'SHIPPER' | 'DRIVER' }
  Response: { success: true, data: { user, accessToken, refreshToken } }
  Sets refreshToken as httpOnly cookie

POST /api/v1/auth/refresh
  Cookie: refreshToken
  Response: { success: true, data: { accessToken } }

POST /api/v1/auth/logout
  Auth: required
  Clears refreshToken cookie, deletes from Redis
```

**`src/routes/jobs/index.ts`**

```
POST /api/v1/jobs
  Auth: requireShipper
  Body: CreateJobInput (origin, destination, cargoDescription, requiredTonnes,
        specialRequirements, askingPrice, currency)
  Response: { success: true, data: { job } }

GET /api/v1/jobs
  Auth: requireAuth
  Query: ?role=shipper|driver&lat=&lng=&status=
  Response: { success: true, data: { jobs } }
  Shipper: returns their own jobs
  Driver: returns available loads near them (requires lat/lng)

GET /api/v1/jobs/:jobId
  Auth: requireAuth
  Response: { success: true, data: { job } }

PATCH /api/v1/jobs/:jobId/cancel
  Auth: requireShipper
  Response: { success: true, data: { job } }

GET /api/v1/jobs/:jobId/market-reference
  Auth: requireAuth
  Query: ?tonnes=
  Returns market reference data for the job's route
  Response: { success: true, data: { marketReference } }
```

**`src/routes/bids/index.ts`**

```
POST /api/v1/bids
  Auth: requireDriver + requireActiveSubscription
  Body: { jobId, offeredPrice }
  Response: { success: true, data: { bid } }

GET /api/v1/bids?jobId=
  Auth: requireAuth
  Response: { success: true, data: { bids } }

PATCH /api/v1/bids/:bidId/accept
  Auth: requireShipper
  Response: { success: true, data: { job } }

PATCH /api/v1/bids/:bidId/counter
  Auth: requireAuth
  Body: { newPrice: number }
  Response: { success: true, data: { bid } }
```

**`src/routes/deliveries/index.ts`**

```
POST /api/v1/deliveries/:jobId/pickup
  Auth: requireDriver
  Body: { photoUri, discrepancyNote? }
  Response: { success: true, data: { delivery } }

POST /api/v1/deliveries/:jobId/confirm
  Auth: requireDriver
  Body: { photoUri, recipientName, signatureUri?, lat?, lng? }
  Response: { success: true, data: { delivery } }

GET /api/v1/deliveries/:jobId/pod
  Auth: requireAuth
  Response: { success: true, data: { pod } }
  Includes presigned download URLs for all photos
```

**`src/routes/messages/index.ts`**

```
POST /api/v1/messages
  Auth: requireAuth
  Body: { jobId, content?, mediaUrl?, mediaType? }
  Saves to Postgres AND emits chat:message via Socket.IO
  Response: { success: true, data: { message } }

GET /api/v1/messages?jobId=
  Auth: requireAuth
  Response: { success: true, data: { messages } }
  Validate requesting user is a party to the job

PATCH /api/v1/messages/:messageId/read
  Auth: requireAuth
  Emits chat:read via Socket.IO
  Response: { success: true, data: null }
```

**`src/routes/subscriptions/index.ts`**

```
POST /api/v1/subscriptions
  Auth: requireDriver
  Body: { plan: 'WEEKLY' | 'MONTHLY' | 'ANNUAL', phone }
  Response: { success: true, data: { subscription, pollUrl } }

GET /api/v1/subscriptions/me
  Auth: requireDriver
  Response: { success: true, data: { subscription, payments } }

PATCH /api/v1/subscriptions/:id/cancel
  Auth: requireDriver
  Response: { success: true, data: { subscription } }

GET /api/v1/subscriptions/upload-url
  Auth: requireDriver
  Internal — generates S3 presigned URL for document upload
  Query: ?folder=documents&mimeType=image/jpeg
  Response: { success: true, data: { uploadUrl, fileKey } }
```

**`src/routes/ratings/index.ts`**

```
POST /api/v1/ratings
  Auth: requireAuth
  Body: { jobId, toUserId, score, tags, comment? }
  Response: { success: true, data: null }

GET /api/v1/ratings?userId=
  Auth: requireAuth
  Response: { success: true, data: { ratings, aggregate } }
```

**`src/routes/drivers/index.ts`**

```
GET /api/v1/drivers/me
  Auth: requireDriver
  Response: { success: true, data: { driver, subscription, documents } }

PATCH /api/v1/drivers/me
  Auth: requireDriver
  Body: { truckMake?, truckModel?, truckYear?, truckRegistration? }
  Response: { success: true, data: { driver } }

PATCH /api/v1/drivers/me/online
  Auth: requireDriver + requireActiveSubscription
  Body: { lat, lng }
  Response: { success: true, data: { isOnline: true } }

PATCH /api/v1/drivers/me/offline
  Auth: requireDriver
  Response: { success: true, data: { isOnline: false } }

GET /api/v1/drivers/me/earnings
  Auth: requireDriver
  Query: ?from=&to= (ISO date strings)
  Response: { success: true, data: { earnings } }
```

**`src/routes/notifications/index.ts`**

```
GET /api/v1/notifications
  Auth: requireAuth
  Response: { success: true, data: { notifications } }

PATCH /api/v1/notifications/:id/read
  Auth: requireAuth
  Response: { success: true, data: null }

POST /api/v1/notifications/fcm-token
  Auth: requireAuth
  Body: { token: string }
  Saves FCM token to user record
  Response: { success: true, data: null }
```

Update `PROGRESS.md` after each route file.

---

## Step 6 — BullMQ workers

Create `src/workers/index.ts` that starts all workers and exports a `startWorkers`
function called from `server.ts`.

Update `PROGRESS.md` after each worker.

**`src/workers/bid-expiry.worker.ts`**

Processes `bid-expiry` queue. When a job fires:

- Call `matching.service.expireBiddingSession(jobId)`
- Log the outcome

**`src/workers/radius-expansion.worker.ts`**

Processes `radius-expansion` queue. When a job fires:

- Call `matching.service.expandSearchRadius(jobId)`
- The service handles scheduling the next expansion if needed

**`src/workers/notification.worker.ts`**

Processes `notification` queue. Job data shape:

```typescript
{
  type: 'driver' | 'shipper' | 'nearby_drivers',
  userId?: string,
  jobId?: string,
  title: string,
  body: string,
  data?: Record<string, string>,
}
```

- For `nearby_drivers`: call `notification.service.notifyNearbyDrivers`
- For `driver` / `shipper`: call `notification.service.notifyDriver/Shipper`
- Retry up to 3 times on failure with exponential backoff

**`src/workers/subscription-renewal.worker.ts`**

Runs on a daily cron schedule (`repeat: { cron: '0 6 * * *' }`).

- Find subscriptions expiring within 24 hours
- Queue Paynow payment initiation for each
- Queue push + SMS notification via notification queue

**`src/workers/subscription-expiry.worker.ts`**

Runs on a daily cron schedule (`repeat: { cron: '0 7 * * *' }`).

- Call `subscription.service.suspendExpiredDrivers()`

**`src/workers/paynow-poll.worker.ts`**

Processes `paynow-poll` queue. Job data:

```typescript
{ subscriptionId: string, pollUrl: string, attemptCount: number }
```

- Call `paynow.pollPayment(pollUrl)`
- On `PAID`: call `subscription.service.handlePaymentConfirmed`
- On `PENDING` and `attemptCount < 30` (5 min / 10s): re-queue with delay 10000ms and attemptCount + 1
- On `FAILED` or `CANCELLED` or timeout: mark subscription payment as failed, notify driver

**`src/workers/index.ts`**

```typescript
import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { QUEUE_NAMES } from "@/lib/queues";
import { processBidExpiry } from "./bid-expiry.worker";
import { processRadiusExpansion } from "./radius-expansion.worker";
import { processNotification } from "./notification.worker";
import { processSubscriptionRenewal } from "./subscription-renewal.worker";
import { processSubscriptionExpiry } from "./subscription-expiry.worker";
import { processPaynowPoll } from "./paynow-poll.worker";

export function startWorkers() {
  const connection = { connection: redis };

  new Worker(QUEUE_NAMES.BID_EXPIRY, processBidExpiry, connection);
  new Worker(QUEUE_NAMES.RADIUS_EXPANSION, processRadiusExpansion, connection);
  new Worker(QUEUE_NAMES.NOTIFICATION, processNotification, connection);
  new Worker(
    QUEUE_NAMES.SUBSCRIPTION_RENEWAL,
    processSubscriptionRenewal,
    connection,
  );
  new Worker(
    QUEUE_NAMES.SUBSCRIPTION_EXPIRY,
    processSubscriptionExpiry,
    connection,
  );
  new Worker(QUEUE_NAMES.PAYNOW_POLL, processPaynowPoll, connection);

  console.log("All BullMQ workers started");
}
```

Update `PROGRESS.md` when all workers are complete.

---

## Step 7 — Socket.IO event wiring

Wire all Socket.IO events defined in `CLAUDE.md` under "Socket.IO event contracts".
Events must be emitted from the correct service functions — not from route handlers.

**Events to emit from services:**

From `bid.service.acceptBid`:

```typescript
jobsNs.to(`job:${jobId}`).emit("job:matched", { job, driver, bid });
```

From `bid.service.placeBid`:

```typescript
jobsNs.to(`job:${jobId}`).emit("job:bid_received", { bid, driver });
```

From `bid.service.counterBid`:

```typescript
jobsNs.to(`job:${jobId}`).emit("job:bid_status_updated", { bid });
```

From `job.service.transitionJobStatus`:

```typescript
jobsNs.to(`job:${jobId}`).emit("job:status_changed", { jobId, status });
```

From `matching.service.expandSearchRadius`:

```typescript
jobsNs.to(`job:${jobId}`).emit("job:radius_expanded", { jobId, newRadiusKm });
```

From `matching.service.expireBiddingSession`:

```typescript
jobsNs.to(`job:${jobId}`).emit("job:expired", { jobId });
```

From `location.service.updateDriverLocation` (when driver has active job):

```typescript
locationNs
  .to(`job:${jobId}`)
  .emit("location:driver", { lat, lng, heading, speed, etaSeconds });
```

From `message routes` POST handler:

```typescript
chatNs.to(`job:${jobId}`).emit("chat:message", message);
```

Update `PROGRESS.md` when done.

---

## Step 8 — Input validation schemas

Create `src/schemas/` with Zod schemas for every route body and query.
Never trust incoming data — validate everything at the boundary.

```typescript
// src/schemas/auth.schema.ts
export const sendOTPSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
});

export const verifyOTPSchema = z.object({
  phone: z.string(),
  code: z
    .string()
    .length(6)
    .regex(/^[0-9]{6}$/),
  role: z.enum(["SHIPPER", "DRIVER"]),
});

// src/schemas/job.schema.ts
export const createJobSchema = z.object({
  originAddress: z.string().min(5),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().min(5),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  cargoDescription: z.string().min(3).max(500),
  requiredTonnes: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(5),
    z.literal(10),
    z.literal(20),
    z.literal(30),
  ]),
  specialRequirements: z
    .array(z.enum(["FRAGILE", "REFRIGERATED", "OVERSIZED", "HAZARDOUS"]))
    .default([]),
  askingPrice: z.number().positive().max(100000),
  currency: z.string().length(3).default("USD"),
});

// src/schemas/bid.schema.ts
export const placeBidSchema = z.object({
  jobId: z.string().uuid(),
  offeredPrice: z.number().positive().max(100000),
});

export const counterBidSchema = z.object({
  newPrice: z.number().positive().max(100000),
});
```

Create schemas for all other routes. Validate in route handlers using:

```typescript
const body = createJobSchema.parse(req.body);
```

Wrap in try/catch and return 400 with `details` on `ZodError`.

Update `PROGRESS.md` when done.

---

## Step 9 — Market reference endpoint

The market reference widget (screen 09 in the designs) requires a server-side
endpoint that returns pricing intelligence for a given route and tonnage.

`GET /api/v1/jobs/:jobId/market-reference?tonnes=10`

Implementation in `src/services/market.service.ts`:

```typescript
export async function getMarketReference(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  tonnes: number,
): Promise<MarketReference>;
```

Query Postgres for completed jobs on similar routes (within 50km of both origin
and destination) with matching tonnage tier, in the last 30 days:

```sql
SELECT
  COUNT(*)                    AS job_count,
  MIN(b.offered_price)        AS low,
  PERCENTILE_CONT(0.5)
    WITHIN GROUP (ORDER BY b.offered_price) AS median,
  MAX(b.offered_price)        AS high
FROM jobs j
JOIN bids b ON b.id = j.matched_bid_id
WHERE
  j.status IN ('DELIVERED', 'COMPLETED')
  AND j.required_tonnes = $1
  AND j.created_at > NOW() - INTERVAL '30 days'
  AND ST_Distance(
    ST_SetSRID(ST_Point(j.origin_lng, j.origin_lat), 4326)::geography,
    ST_SetSRID(ST_Point($2, $3), 4326)::geography
  ) < 50000
  AND ST_Distance(
    ST_SetSRID(ST_Point(j.dest_lng, j.dest_lat), 4326)::geography,
    ST_SetSRID(ST_Point($4, $5), 4326)::geography
  ) < 50000
```

Cache the result in Redis for 1 hour:
`loada:market:<routeHash>:<tonnes>` with 3600s TTL.

If fewer than 5 historical jobs found, return a fallback estimate based on
distance × per-km rate for the tonnage tier.

Also return `estimatedMatchMinutes` — estimated time to first bid based on
the number of active drivers within 25km and historical bid response times.

Update `PROGRESS.md` when done.

---

## Step 10 — Driver earnings endpoint

The earnings dashboard (screen 24) requires a structured earnings summary.

`GET /api/v1/drivers/me/earnings?from=2025-05-13&to=2025-05-19`

Implementation in `src/services/earnings.service.ts`:

```typescript
export async function getEarningsSummary(
  driverId: string,
  from: Date,
  to: Date,
): Promise<EarningsSummary>;
```

Query:

- All completed jobs where `matchedDriverId = driverId` and `createdAt` in range
- Group by day of week
- Sum `matchedBid.offeredPrice` per day
- Calculate: totalEarned, jobsCompleted, totalDistanceKm, averagePerJob, bestDay
- Include the driver's subscription cost for the period
- Compare to previous equivalent period for the `+X%` trend indicator

Update `PROGRESS.md` when done.

---

## Step 11 — PM2 configuration

Create `ecosystem.config.js` at the API root:

```javascript
module.exports = {
  apps: [
    {
      name: "loada-api",
      script: "dist/server.js",
      instances: 2,
      exec_mode: "cluster",
      env_production: { NODE_ENV: "production", PORT: 3000 },
    },
  ],
};
```

Create `nginx.conf` template in `docs/`:

```nginx
upstream loada_api {
  server 127.0.0.1:3000;
  server 127.0.0.1:3001;
}

server {
  listen 80;
  server_name api.loada.app;

  location /api/ {
    proxy_pass         http://loada_api;
    proxy_http_version 1.1;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
  }

  location /socket.io/ {
    proxy_pass         http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection "upgrade";
    proxy_set_header   Host $host;
  }
}
```

Update `PROGRESS.md` when done.

---

## Step 12 — Verify

Run through this checklist before marking the task complete. Fix anything that fails.

**Server starts:**

- [ ] `npm run dev` starts without errors
- [ ] `GET /health` returns `{ status: 'ok' }`
- [ ] Prisma connects to the database
- [ ] Redis connects
- [ ] All 6 BullMQ workers start without errors

**Auth flow:**

- [ ] `POST /api/v1/auth/send-otp` queues an OTP in Redis
- [ ] `POST /api/v1/auth/verify-otp` with valid code returns tokens
- [ ] `POST /api/v1/auth/verify-otp` with invalid code returns 401
- [ ] `POST /api/v1/auth/refresh` rotates tokens correctly
- [ ] Protected routes return 401 without valid JWT

**Job flow:**

- [ ] `POST /api/v1/jobs` creates a job and schedules bid-expiry + radius-expansion queue jobs
- [ ] `GET /api/v1/jobs?role=driver&lat=&lng=` returns loads filtered by driver capacity
- [ ] `POST /api/v1/bids` enforces all 5 business rules from CLAUDE.md
- [ ] `PATCH /api/v1/bids/:id/accept` transitions job to MATCHED and rejects other bids
- [ ] `POST /api/v1/deliveries/:jobId/pickup` requires job to be in PICKUP_ARRIVED status
- [ ] `POST /api/v1/deliveries/:jobId/confirm` creates full POD record with GPS stamp
- [ ] `GET /api/v1/deliveries/:jobId/pod` returns presigned S3 URLs

**Business rules:**

- [ ] Driver cannot bid without ACTIVE subscription (returns 403 SUBSCRIPTION_REQUIRED)
- [ ] Driver cannot bid with PENDING documents (returns 403)
- [ ] Driver cannot bid if capacityTonnes < requiredTonnes (returns 400)
- [ ] Driver cannot have more than 3 active bids (returns 400)
- [ ] Shipper cannot post while a job is MATCHED through IN_TRANSIT (returns 400)

**Queue workers:**

- [ ] bid-expiry worker fires after TTL and transitions expired job correctly
- [ ] radius-expansion worker fires at 60s, expands radius, notifies new drivers
- [ ] paynow-poll worker polls correctly and handles PAID/FAILED status

**Socket.IO:**

- [ ] Connecting to `/jobs` namespace and subscribing to a job room receives bid events
- [ ] Driver location updates on `/location` namespace reach the shipper's tracking room
- [ ] Chat messages on `/chat` namespace are broadcast to both parties

**TypeScript:**

- [ ] `npx tsc --noEmit` — zero errors
- [ ] No `any` types in any file
- [ ] All Prisma query results are properly typed

**Database:**

- [ ] `npm run db:seed` populates the database with test data
- [ ] Market reference query returns results for seeded jobs
- [ ] Earnings query returns correct daily breakdown

---

## What this is not

Do not set up Docker. Do not configure multi-region. Do not add Kafka.
Do not add a second database. The MVP runs on a single EC2 t3.medium with
PM2 and NGINX exactly as specified in `CLAUDE.md` under "Deployment — MVP".

Do not add any package not already listed in Step 1 without a clear reason
and a note in `PROGRESS.md` explaining why.

---

## When you are done

1. Update `PROGRESS.md` — mark every item complete
2. Run `npx tsc --noEmit` — confirm zero TypeScript errors
3. Run `npm run dev` — confirm server starts cleanly
4. Run `npm run db:seed` — confirm seed data loads without errors
5. Write a summary at the bottom of `PROGRESS.md` noting:
   - Any business rules that required interpretation
   - Any Prisma schema changes made (there should be none — update CLAUDE.md if any)
   - Any third-party integration quirks discovered (Paynow, BulkIT webhook stub)
   - Recommended priorities for the next phase (mobile ↔ API integration)
