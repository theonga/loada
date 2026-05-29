# Loada API Reference

Base URL: `https://api.loada.app/v1`
All responses use the standard envelope:
```json
// Success
{ "success": true, "data": { ... }, "meta": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable", "details": [...] } }
```
Authentication: `Authorization: Bearer <accessToken>` on all protected routes.

---

## Auth

### POST /auth/send-otp
Request OTP for a phone number. OTP expires after 10 minutes, single-use only.
Rate limited: 3 requests per phone per 10 minutes.

**Body**
```json
{ "phone": "+263771234567" }
```
**Response**
```json
{ "success": true, "data": { "message": "OTP sent" } }
```

---

### POST /auth/verify-otp
Verify OTP and log in (or register on first use).

**Body**
```json
{ "phone": "+263771234567", "code": "123456", "role": "SHIPPER" }
```
`role` accepted values: `SHIPPER`, `DRIVER` — the role the user picked at the role-selection screen.

**Response**
```json
{
  "data": {
    "user": { "id": "...", "name": "...", "role": "BOTH", "phone": "+263771234567" },
    "accessToken": "eyJ...",
    "refreshToken": "abc123...",
    "isNewUser": false,
    "activeRole": "DRIVER"
  }
}
```
Access token expires in 15 minutes. Refresh token expires in 30 days.

`activeRole` is the role the client should drop the user into right now. For a single-role
user it always equals `user.role`. For a `BOTH` user it reflects the choice they made at
the role screen on this login.

**Role-upgrade behaviour:** if an existing single-role user signs in with the other role,
their `User.role` is upgraded to `BOTH` and the missing profile (`ShipperProfile` or
`DriverProfile`) is created automatically. `activeRole` in the response will be the role
they just picked. This avoids the dead-end where a SHIPPER-signed-up user could pick
"Driver" and land in an empty driver UI.

`isNewUser: true` means this is the first login for this phone number. New users are
created with an empty `name` — the client **must** call `PATCH /auth/me` with the
user's chosen name before proceeding.

---

### PATCH /auth/me
Update the authenticated user's display name.

**Auth** required

**Body**
```json
{ "name": "Tendai Moyo" }
```

**Response**
```json
{ "data": { "name": "Tendai Moyo" } }
```

---

### POST /auth/refresh
Issue a new access token using a refresh token.

**Body**
```json
{ "userId": "user-uuid", "refreshToken": "abc123..." }
```
**Response**
```json
{ "data": { "accessToken": "eyJ...", "refreshToken": "new-refresh-token..." } }
```

---

### POST /auth/logout
Invalidate the current refresh token.

**Auth** required.

---

### POST /auth/switch-role
Switch the active role on the current session. `BOTH` users only — single-role users
need to log in again with the other role to upgrade.

**Auth** required

**Body**
```json
{ "role": "DRIVER" }
```
`role` accepted values: `SHIPPER`, `DRIVER`

**Response**
```json
{ "data": { "accessToken": "eyJ...", "activeRole": "DRIVER" } }
```

The returned access token carries the new active role. The client should swap its stored
token in place and re-mount the role-specific tabs.

**Errors**
- `ROLE_UPGRADE_REQUIRED` (400) — user only holds one role; need to re-login with the other role
- `NO_SHIPPER_PROFILE` / `NO_DRIVER_PROFILE` (400) — profile missing on `BOTH` user (shouldn't happen in normal flow)

---

## Jobs

### POST /jobs
Create a new job. Shipper only. Schedules bid-expiry and radius-expansion BullMQ workers.
Business rule: shipper cannot post if they have a job in MATCHED–IN_TRANSIT status.

**Auth** required (SHIPPER role)

**Body**
```json
{
  "originAddress": "Avondale, Harare",
  "originLat": -17.7896,
  "originLng": 31.0391,
  "destAddress": "Mutare City",
  "destLat": -18.9707,
  "destLng": 32.6709,
  "cargoDescription": "Building materials",
  "requiredTonnes": 10,
  "specialRequirements": ["OVERSIZED"],
  "askingPrice": 420,
  "currency": "USD"
}
```
`requiredTonnes` must be one of: `1 | 2 | 5 | 10 | 20 | 30`
`specialRequirements` values: `FRAGILE | REFRIGERATED | OVERSIZED | HAZARDOUS`

**Response** `201`
```json
{ "data": { "job": { "id": "...", "status": "POSTED", ... } } }
```

---

### GET /jobs
For shippers: returns their own jobs.
For drivers: returns available loads near a given location (PostGIS radius query).

**Auth** required

**Query params (driver)**
```
lat=-17.8292&lng=31.0522
```

**Response**
```json
{ "data": { "jobs": [ { ... } ] } }
```

---

### GET /jobs/:jobId
Get a single job with bids and delivery.

**Auth** required

---

### PATCH /jobs/:jobId/cancel
Cancel a job. Shipper only.

**Auth** required (SHIPPER role)

**Cancellation rules:**
- Allowed in `POSTED`, `BIDDING`, `RADIUS_EXPANDED`, `MATCHED`, `PICKUP_EN_ROUTE` — all reserved commissions are refunded to the bidding drivers.
- **Rejected with `POST_PICKUP_NO_SHIPPER_CANCEL`** once status reaches `PICKUP_ARRIVED`, `LOADED`, `IN_TRANSIT`, or `DELIVERED`. Shipper must open a dispute via support; only admin can force-cancel post-pickup.
- Rejected with `INVALID_STATUS` for terminal states (`COMPLETED`, `CANCELLED`).

The post-pickup lock closes the shipper+driver collusion path where a "cancel" after
delivery could be used to refund Loada's commission.

**Response**
```json
{ "data": null }
```

---

### PATCH /jobs/:jobId/status
Advance a job through the delivery pipeline. Driver only, must be the matched driver.

**Auth** required (DRIVER role)

**Allowed transitions:**
| From | To |
|------|----|
| MATCHED | PICKUP_EN_ROUTE |
| PICKUP_EN_ROUTE | PICKUP_ARRIVED |
| LOADED | IN_TRANSIT |

**Body**
```json
{ "status": "PICKUP_EN_ROUTE" }
```

**Response**
```json
{ "data": { "job": { "id": "...", "status": "PICKUP_EN_ROUTE", ... } } }
```

---

### GET /jobs/:jobId/market-reference
Get the market reference price for a route (median of historical completed jobs).
Falls back to distance × per-km rate table if fewer than 5 historical jobs. Cached 1 hour in Redis.

**Auth** required

**Query**
```
tonnes=10
```

**Response**
```json
{
  "data": {
    "marketReference": {
      "median": 400,
      "low": 350,
      "high": 480,
      "sampleSize": 12,
      "currency": "USD",
      "isFallback": false
    }
  }
}
```

---

## Bids

### POST /bids
Place a bid on a job. Driver only. Reserves the commission from the driver's wallet
inside the same transaction as the bid create.

**Business rules enforced (in order):**
1. Driver documents must be APPROVED
2. Driver cannot bid on their own job (`SELF_TRADE_FORBIDDEN`) — prevents BOTH-role users from posting and self-accepting
3. Driver `capacityTonnes` ≥ `job.requiredTonnes`
4. Driver has no other active job (already `MATCHED`..`IN_TRANSIT`)
5. Driver has fewer than `max_active_bids_per_driver` (default 3) active bids
6. Driver hasn't already bid on this job (no duplicate PENDING/COUNTERED bid)
7. Job `biddingExpiresAt` must not have passed, and `status` ∈ {POSTED, BIDDING, RADIUS_EXPANDED}
8. Driver `wallet.balance` ≥ commission (commission = `loada_commission_pct × offeredPrice`)

The commission moves from `balance` to `reservedBalance` atomically with the bid create;
it's released (back to balance) on bid reject / expire / pre-pickup job cancel, and
deducted (as Loada revenue) on `confirmDelivery` or by the `auto-settle` worker.

**Auth** required (DRIVER role)

**Body**
```json
{ "jobId": "job-uuid", "offeredPrice": 390, "currency": "USD", "note": "Optional note" }
```

**Response** `201`
```json
{ "data": { "bid": { "id": "...", "status": "PENDING", "commissionAmount": "58.50", ... } } }
```

**Errors**
- `SELF_TRADE_FORBIDDEN` (400)
- `DOCUMENTS_NOT_APPROVED` (403)
- `INSUFFICIENT_CAPACITY` (400)
- `ACTIVE_JOB_IN_PROGRESS` (400)
- `MAX_BIDS_REACHED` (400)
- `DUPLICATE_BID` (400)
- `BIDDING_EXPIRED` (400)
- `JOB_NOT_ACCEPTING_BIDS` (400)
- `INSUFFICIENT_WALLET_BALANCE` (402) — includes `requiredAmount` and `currentBalance` on the error object

---

### GET /bids
Get all bids for a job.

**Auth** required

**Query**
```
jobId=job-uuid
```

---

### PATCH /bids/:bidId/accept
Accept a bid. Atomically sets bid to ACCEPTED and all other bids on the job to REJECTED.
Updates job status to MATCHED.

**Auth** required (SHIPPER role, must own the job)

**Response**
```json
{ "data": { "job": { "id": "...", "status": "MATCHED", "matchedDriverId": "...", "matchedBidId": "..." } } }
```

---

### PATCH /bids/:bidId/counter
Counter a bid with a new price.

**Auth** required (SHIPPER role)

**Body**
```json
{ "counterPrice": 360 }
```

---

## Deliveries

### POST /deliveries/:jobId/pickup
Confirm cargo has been loaded. Job must be in `PICKUP_ARRIVED` status. Transitions the
job directly to `IN_TRANSIT` (the `LOADED` intermediate state is skipped — see
`docs/DECISIONS.md` "PATCH /jobs/:jobId/status").

**Auth** required (DRIVER role, must be matched driver)

**Server-side GPS gate:** The driver's `DriverProfile.lastLocation*` must be within
`delivery_gps_tolerance_km` (default 0.5) of the job's `originLat/Lng`, and the fix
must be < 30 minutes old. Client-supplied `lat`/`lng` in the body are stored on the
delivery row but **are not used for verification** — a malicious client could spoof
any coordinate. The location heartbeat on the `/location` socket is the source of truth.

**Body**
```json
{ "photoUri": "delivery/uuid-pickup.jpg", "lat": -17.9318, "lng": 31.0928, "discrepancyNote": "optional" }
```

**Errors**
- `INVALID_STATUS` (400) — job not in PICKUP_ARRIVED
- `FORBIDDEN` (403) — caller is not the matched driver
- `GPS_UNAVAILABLE` (400) — no recent location heartbeat (turn on GPS)
- `GPS_TOO_FAR` (400) — driver is outside the proximity tolerance; error object carries `distanceKm` and `toleranceKm`

---

### POST /deliveries/:jobId/confirm
Confirm delivery. Job must be `IN_TRANSIT`. Transitions to `DELIVERED`, persists proof
of delivery, and **settles the commission** — moves the bid's `commissionAmount` from
the driver's `reservedBalance` to Loada revenue (`WalletTransaction.type = COMMISSION_DEDUCT`).

**Auth** required (DRIVER role, must be matched driver)

**Server-side GPS gate:** Same shape as `/pickup` but checked against `job.destLat/Lng`.
See errors below.

**Commission fallback:** If the bid's stored `commissionAmount` is `null` (legacy bid,
admin-injected bid), the server recomputes from `loada_commission_pct × offeredPrice`
and logs a warning instead of silently skipping. If the reserved balance doesn't cover
the full charge (commission % changed mid-trip, etc.), the shortfall is pulled from
the driver's available `balance` and the wallet transaction note is annotated.

**Body**
```json
{
  "photoUri": "delivery/uuid-delivery.jpg",
  "recipientName": "Alice Ncube",
  "signatureUri": "delivery/uuid-signature.jpg",
  "lat": -20.15,
  "lng": 28.58
}
```

**Errors**
- `INVALID_STATUS` (400) — job not IN_TRANSIT
- `FORBIDDEN` (403) — caller is not the matched driver
- `GPS_UNAVAILABLE` (400)
- `GPS_TOO_FAR` (400)

---

### GET /deliveries/:jobId/pod
Get proof of delivery. Returns S3 presigned download URLs (1 hour TTL).

**Auth** required

**Response**
```json
{
  "data": {
    "pod": {
      "pickupConfirmedAt": "2026-05-22T10:00:00Z",
      "pickupPhotoUrl": "https://s3.amazonaws.com/...",
      "deliveredAt": "2026-05-22T14:00:00Z",
      "deliveryPhotoUrl": "https://s3.amazonaws.com/...",
      "signatureUrl": null,
      "recipientName": "Alice Ncube"
    }
  }
}
```

---

## Messages

### POST /messages
Send a message in a job's chat thread. The server soft-moderates every outgoing message
against patterns for phone numbers, contact handles (WhatsApp, Telegram, email), and
collusion phrases ("off-platform", "cash only", "cancel and re-post directly", …).
Hits are stored on `Message.flaggedReason` (comma-separated pattern names) and surfaced
to admin via `/v1/admin/audit/flagged-messages`. **Messages are never blocked** — the
flag is informational only.

**Auth** required

**Body**
```json
{ "jobId": "job-uuid", "content": "Hi, any issues?", "mediaUrl": null, "mediaType": null }
```

**Response** `201`
```json
{
  "data": {
    "message": {
      "id": "...",
      "content": "Hi, any issues?",
      "flaggedReason": null,
      "createdAt": "..."
    }
  }
}
```

---

### GET /messages
Get chat messages for a job.

**Auth** required

**Query**
```
jobId=job-uuid
```

---

### PATCH /messages/:messageId/read
Mark a message as read.

**Auth** required

---

## Wallet

Loada uses a **pay-per-use commission model** instead of subscriptions. Drivers fund a
wallet via Paynow, the commission is reserved on each bid, and deducted on delivery.
See `CLAUDE.md` "Trust & Safety" for the integrity controls.

### GET /wallet/me
Get the driver's current wallet balance.

**Auth** required (DRIVER role)

**Response**
```json
{
  "data": {
    "balance": 42.50,
    "reservedBalance": 12.00,
    "commissionPct": 15
  }
}
```
- `balance` — available to spend (cover commission reservations on new bids)
- `reservedBalance` — locked against active PENDING/COUNTERED/ACCEPTED bids
- `commissionPct` — current value of `loada_commission_pct` so the bid screen can preview the fee

---

### POST /wallet/deposit
Initiate a Paynow wallet top-up. Returns a `pollUrl` that the BullMQ `paynow-poll` worker
hits every `paynow_poll_interval_seconds`; on `PAID` the driver's `balance` is credited
and a `wallet:balance_updated` event is broadcast on the `/jobs` socket.

**Auth** required (DRIVER role)

**Body**
```json
{ "amount": 25, "method": "ecocash", "phone": "+263771234567" }
```
- `method` values: `ecocash | onemoney | vmc`
- `phone` required for `ecocash` and `onemoney` (STK push). Optional for `vmc` (card flow)
- `amount` must be ≥ `min_deposit_usd` (default 10) — otherwise `BELOW_MIN_DEPOSIT`

**Response** `201`
```json
{
  "data": {
    "transactionId": "...",
    "pollUrl": "https://www.paynow.co.zw/Interface/CheckPayment/?...",
    "redirectUrl": "https://www.paynow.co.zw/Payment/..."
  }
}
```

The mobile client opens `redirectUrl` for the card flow, or shows a "Confirm on your phone"
state and waits for the socket event for EcoCash/OneMoney. There's no need to poll the
API — the socket pushes the balance change.

---

### GET /wallet/transactions
Paginated history of wallet movements (deposits, reservations, releases, deductions, refunds).

**Auth** required (DRIVER role)

**Query**
```
limit=20
```

**Response**
```json
{
  "data": {
    "transactions": [
      {
        "id": "...",
        "type": "COMMISSION_DEDUCT",
        "amount": "8.55",
        "bidId": "...",
        "jobId": "...",
        "note": "Loada platform fee",
        "status": "PAID",
        "createdAt": "..."
      }
    ]
  }
}
```
`type` values: `DEPOSIT | COMMISSION_RESERVE | COMMISSION_RELEASE | COMMISSION_DEDUCT | REFUND`

---

### POST /payments/result
Paynow server-to-server webhook. Public (no JWT) — protected by the `hash` field, which
is verified with the integration key before any state change. On a verified `PAID`
status, the matching `WalletTransaction` is confirmed via `confirmDeposit`.

This is the belt-and-suspenders path. The primary confirmation path is the poller worker.

---

### POST /uploads/presign
Get a presigned S3 URL for uploading a file (driver documents, delivery photos, chat
media). Upload size cap depends on the purpose (10MB photos, 20MB documents, 5MB voice).

**Auth** required

**Body**
```json
{ "purpose": "delivery", "mimeType": "image/jpeg" }
```
`purpose` values: `driver-docs | pickup | delivery | profile | chat`

**Response**
```json
{ "data": { "presignedUrl": "https://s3.amazonaws.com/...", "s3Key": "delivery/uuid.jpg" } }
```

### POST /uploads/confirm
Acknowledge a completed S3 upload. Returns a short-lived presigned download URL for
immediate in-app preview. Persist the `s3Key`, **not** the URL — URLs expire in 1 hour.

**Auth** required

**Body**
```json
{ "s3Key": "delivery/uuid.jpg" }
```

**Response**
```json
{ "data": { "s3Key": "delivery/uuid.jpg", "url": "https://s3.amazonaws.com/..." } }
```

---

## Ratings

### POST /ratings
Submit a rating for a job participant. Both shipper and driver must rate each other.
Cannot rate the same job twice.

**Auth** required

**Body**
```json
{
  "jobId": "job-uuid",
  "toUserId": "user-uuid",
  "score": 5,
  "tags": ["ON_TIME", "PROFESSIONAL"],
  "comment": "Great driver"
}
```
`tags` values: `ON_TIME | CAREFUL_WITH_CARGO | PROFESSIONAL | GOOD_COMMUNICATION`

---

### GET /ratings
Get ratings for a user with aggregate average.

**Auth** required

**Query**
```
userId=user-uuid
```

**Response**
```json
{
  "data": {
    "ratings": [ { "score": 5, "tags": [...], "fromUser": { "name": "..." }, ... } ],
    "aggregate": { "average": 4.8, "count": 24 }
  }
}
```

---

## Drivers

### GET /drivers/me
Get the authenticated driver's full profile, including freshly resolved S3 URLs for
every document and photo.

**Auth** required (DRIVER role)

**Response**
```json
{
  "data": {
    "driver": {
      "id": "...",
      "truckType": "TRUCK",
      "capacityTonnes": 10,
      "truckMake": "Isuzu",
      "truckModel": "NQR",
      "truckYear": 2018,
      "truckRegistration": "AAA-1234",
      "truckPhotoUrl": "https://s3.amazonaws.com/...",
      "licenceUrl": "https://s3.amazonaws.com/...",
      "documentStatus": "APPROVED",
      "isOnline": true,
      "user": { "id": "...", "name": "...", "phone": "+263...", "email": null, "profilePhotoUrl": null }
    },
    "documents": {
      "licenceUrl": "https://...",
      "registrationUrl": "https://...",
      "status": "APPROVED"
    }
  }
}
```

---

### PATCH /drivers/me
Update driver profile fields (truck details, document URLs).

**Auth** required (DRIVER role)

---

### PATCH /drivers/me/online
Set driver online and update GPS location. Adds driver to Redis geo index. No
subscription gate — going online just means the driver wants to receive load
notifications. Eligibility to actually bid is enforced at `POST /bids`.

**Auth** required (DRIVER role)

**Body**
```json
{ "lat": -17.8292, "lng": 31.0522 }
```

---

### PATCH /drivers/me/offline
Set driver offline. Removes driver from Redis geo index.

**Auth** required (DRIVER role)

---

### GET /drivers/me/earnings
Get driver earnings breakdown.

**Auth** required (DRIVER role)

**Query**
```
period=week   # or: month | year
```

**Response**
```json
{
  "data": {
    "earnings": {
      "totalEarned": 1030,
      "totalCommissionPaid": 154.50,
      "netEarned": 875.50,
      "jobsCompleted": 2,
      "averagePerJob": 515,
      "trendPercent": 12.5,
      "bestDay": { "date": "2026-05-22", "dayOfWeek": "Fri", "earned": 1030, "jobs": 2 },
      "byDay": [
        { "date": "2026-05-22", "dayOfWeek": "Fri", "earned": 1030, "commissionPaid": 154.50, "jobs": 2 }
      ],
      "walletBalance": 42.50
    }
  }
}
```
`netEarned = totalEarned − totalCommissionPaid` (the commission is the only Loada cut —
there are no subscription costs in this model).

---

## Notifications

Notifications are now persisted in PostgreSQL alongside the FCM push so the in-app
notifications screen has a real history. `Notification.userId` always stores `User.id`
(resolved server-side from whichever profile triggered the event). The BullMQ payload
field used to dispatch a notification is `targetId` — which is `DriverProfile.id` for
`type: "driver"` events and `ShipperProfile.id` for `type: "shipper"` events. See
`apps/api/src/workers/notification.worker.ts` for the discriminated union.

### GET /notifications
Latest 50 notifications for the authenticated user, newest first.

**Auth** required

**Response**
```json
{
  "data": {
    "notifications": [
      {
        "id": "...",
        "type": "match_confirmed",
        "title": "You got the load!",
        "body": "...",
        "jobId": "...",
        "isRead": false,
        "createdAt": "..."
      }
    ]
  }
}
```

---

### PATCH /notifications/:id/read
Mark a specific notification as read.

**Auth** required

---

### PATCH /notifications/read-all
Mark every unread notification for the authenticated user as read.

**Auth** required

---

### POST /notifications/fcm-token
Register or update the FCM device token for push notifications.

**Auth** required

**Body**
```json
{ "fcmToken": "firebase-device-token" }
```

---

## SMS

### POST /sms/webhook
BulkIT delivery report webhook. Validates the `X-BulkIT-Signature` header.
This endpoint is public (no JWT auth); security is via HMAC signature verification.

---

## Health

### GET /health
```json
{ "status": "ok", "timestamp": "2026-05-22T10:00:00.000Z" }
```

---

## Admin

All admin routes require `Authorization: Bearer <admin_token>` (8-hour JWT, type: "admin").
The token is obtained from `POST /v1/admin/auth/login`.

### POST /v1/admin/auth/login
```json
{ "username": "admin", "password": "changeme123" }
```
Response: `{ token, username }`

### GET /v1/admin/stats
Returns platform dashboard numbers.
Response:
```json
{
  "stats": {
    "totalUsers": 0,
    "totalDrivers": 0,
    "totalShippers": 0,
    "onlineDrivers": 0,
    "onlineShippers": 0,
    "totalJobs": 0,
    "activeJobs": 0,
    "completedJobsToday": 0,
    "pendingDocuments": 0,
    "totalWalletFunds": 0,
    "totalCommissionCollected": 0,
    "commissionThisMonth": 0
  }
}
```
- `onlineDrivers` — `DriverProfile.isOnline = true`
- `onlineShippers` — count of shippers holding a live `/jobs` socket connection in the last 60s (tracked in Redis ZSET `loada:presence:shippers`)
- `totalWalletFunds` — `sum(balance + reservedBalance)` across all driver wallets
- `totalCommissionCollected` — all-time `COMMISSION_DEDUCT` total
- `commissionThisMonth` — `COMMISSION_DEDUCT` total since the 1st of the current month

### GET /v1/admin/analytics
Time-series for the Overview charts. Query: `from` (ISO datetime), `to` (ISO datetime),
`granularity` (`day` | `week` | `month`). Returns jobs created/completed per period,
commission revenue per period, new users per period, plus current jobs-by-status and
driver-wallet-balance bands.

### GET /v1/admin/config
Returns every config key with its current value, label, group, and last-updated metadata.
Groups: `pricing | bidding | matching | trust | auth | payments | market`.

### PATCH /v1/admin/config
```json
{ "loada_commission_pct": "12", "delivery_gps_tolerance_km": "0.75" }
```
Accepts any subset of `ConfigKey` keys. Invalidates the Redis cache for updated keys
(changes take effect within ~60s).

### GET /v1/admin/users
Query: `page`, `limit`, `role` (SHIPPER|DRIVER|BOTH), `search`, `suspended` (boolean)

### PATCH /v1/admin/users/:userId/suspend
```json
{ "reason": "Violation of terms" }
```

### PATCH /v1/admin/users/:userId/unsuspend
No body required.

### POST /v1/admin/users/bulk-suspend
```json
{ "ids": ["..."], "reason": "..." }
```

### POST /v1/admin/users/bulk-unsuspend
```json
{ "ids": ["..."] }
```

### GET /v1/admin/drivers
Query: `page`, `limit`, `documentStatus` (PENDING|UNDER_REVIEW|APPROVED|REJECTED|EXPIRED).
Response includes each driver's `wallet` (balance, reservedBalance) for the admin docs
review modal.

### PATCH /v1/admin/drivers/:driverId/approve-docs
No body. Sets `documentStatus = APPROVED`.

### PATCH /v1/admin/drivers/:driverId/reject-docs
```json
{ "reason": "Licence photo unreadable" }
```

### POST /v1/admin/drivers/bulk-approve-docs
```json
{ "ids": ["..."] }
```

### POST /v1/admin/drivers/bulk-reject-docs
```json
{ "ids": ["..."], "reason": "..." }
```

### GET /v1/admin/jobs
Query: `page`, `limit`, `status`. Each row includes `cargoDescription`,
`specialRequirements`, `_count.bids`, `_count.messages`, the accepted bid, and the
delivery row — enough for the in-list cargo column and the View action.

### GET /v1/admin/jobs/:jobId
Full job detail for the admin View modal — every bid (not just accepted), the delivery
row, the last 50 messages with senders, and the ratings. Used by the Trust & Audit page
when drilling into a flagged conversation.

### PATCH /v1/admin/jobs/:jobId/cancel
```json
{ "reason": "Admin forced cancellation" }
```
Force-cancels the job, releases reserved commissions for losing bids, and **deducts**
the accepted bid's commission if the cancel happens post-pickup (see CLAUDE.md
"Trust & Safety" for the refund matrix). Notifies both shipper and driver.

### POST /v1/admin/jobs/bulk-cancel
```json
{ "ids": ["..."], "reason": "..." }
```
Per-job cancellation with the same cleanup as the single endpoint. Already-terminal
rows are silently skipped rather than failing the whole batch.

### GET /v1/admin/wallets
Driver wallet list with balance, reserved, recent transactions, and a global stats
strip (totalHeld, totalReserved, zeroCount, driversCount, avg). Query: `page`, `limit`,
`search` (driver name).

### PATCH /v1/admin/wallets/:driverId/adjust
```json
{ "amount": 25, "note": "Manual refund for cancelled job J-2841" }
```
Positive amounts credit, negative amounts debit. Refuses any adjustment that would
leave a negative balance. Writes a `WalletTransaction` with `type = DEPOSIT` or `REFUND`
and a note tagged with the admin username.

---

## Trust & Safety audit

### GET /v1/admin/audit/flagged-messages
Paginated feed of messages where `Message.flaggedReason != null`. Query: `page`, `limit`.

**Response**
```json
{
  "data": {
    "messages": [
      {
        "id": "...",
        "content": "Just whatsapp me on 0771234567 and we'll skip the platform fee",
        "flaggedReason": "phone:zw-local,contact:whatsapp,collusion:avoid-fee",
        "createdAt": "...",
        "sender": { "id": "...", "name": "...", "phone": "+263...", "role": "DRIVER" },
        "job":    { "id": "...", "originAddress": "...", "destAddress": "...", "status": "BIDDING", "shipperId": "..." }
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 50
  }
}
```

The flag string is a comma-separated list of the moderation patterns that matched
(phone-number variants, contact-handle variants, collusion phrases). Soft signal —
admin decides whether to suspend or ignore.

### GET /v1/admin/audit/low-bids
Accepted bids priced below `low_bid_alert_pct` (default 60%) of the per-km × tonnage
market estimate. Used to detect off-platform price negotiation (low in-app bid, high
cash settlement). Query: `page`, `limit`.

**Response**
```json
{
  "data": {
    "jobs": [
      {
        "id": "...",
        "originAddress": "...",
        "destAddress": "...",
        "requiredTonnes": 10,
        "askingPrice": "420.00",
        "bidPrice": "190.00",
        "currency": "USD",
        "status": "IN_TRANSIT",
        "createdAt": "...",
        "shipperName": "...",
        "driverName": "...",
        "distanceKm": 263,
        "estimatedMarket": 1578,
        "ratioPct": 12
      }
    ],
    "threshold": 60,
    "page": 1,
    "limit": 50
  }
}
```

`ratioPct` is `(bidPrice / estimatedMarket) × 100`. Anything below `threshold` is in
the result set.
