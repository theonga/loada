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
`role` accepted values: `SHIPPER`, `DRIVER`

**Response**
```json
{
  "data": {
    "user": { "id": "...", "name": "...", "role": "SHIPPER", "phone": "+263771234567" },
    "accessToken": "eyJ...",
    "refreshToken": "abc123...",
    "isNewUser": true
  }
}
```
Access token expires in 15 minutes. Refresh token expires in 30 days.

`isNewUser: true` means this is the first login for this phone number. The mobile client
should route new users to the name-collection screen (`/(auth)/name`) before role-specific
onboarding. Returning users go directly to their home screen.

New users are created with an empty `name`. The client **must** call `PATCH /auth/me`
with the user's chosen name before proceeding.

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
Cancel a job. Shipper only. Job must be in POSTED or BIDDING status.

**Auth** required (SHIPPER role)

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
Place a bid on a job. Driver only.

**Business rules enforced:**
1. Driver subscription must be ACTIVE
2. Driver documents must be APPROVED
3. Driver `capacityTonnes` ≥ `job.requiredTonnes`
4. Driver cannot have more than 3 active bids simultaneously
5. Job `biddingExpiresAt` must not have passed

**Auth** required (DRIVER role)

**Body**
```json
{ "jobId": "job-uuid", "offeredPrice": 390, "currency": "USD", "note": "Optional note" }
```

**Response** `201`
```json
{ "data": { "bid": { "id": "...", "status": "PENDING", ... } } }
```

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
Confirm cargo has been loaded. Job must be in PICKUP_ARRIVED status.
Transitions job to LOADED. Stores pickup photo URL (S3 key).

**Auth** required (DRIVER role, must be matched driver)

**Body**
```json
{ "photoUri": "delivery/uuid-pickup.jpg", "lat": -17.9318, "lng": 31.0928, "discrepancyNote": "optional" }
```

---

### POST /deliveries/:jobId/confirm
Confirm delivery. Job must be IN_TRANSIT.
Transitions job to DELIVERED. Stores delivery photo, recipient name, optional signature.

**Auth** required (DRIVER role, must be matched driver)

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
Send a message in a job's chat thread.

**Auth** required

**Body**
```json
{ "jobId": "job-uuid", "content": "Hi, any issues?", "mediaUrl": null, "mediaType": null }
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

## Subscriptions

### POST /subscriptions
Create a subscription and initiate Paynow payment.

**Auth** required (DRIVER role)

**Body**
```json
{
  "plan": "MONTHLY",
  "method": "ecocash",
  "phone": "+263771234567",
  "email": "optional@example.com"
}
```
`plan` values: `WEEKLY | MONTHLY | ANNUAL`
`method` values: `ecocash | onemoney | vmc`
`phone` required for `ecocash` and `onemoney`. `email` optional for `vmc` (receipt).

**Response** `201`
```json
{
  "data": {
    "subscription": { "id": "...", "status": "TRIAL", "plan": "MONTHLY", ... },
    "pollUrl": "https://www.paynow.co.zw/Interface/CheckPayment/?...",
    "redirectUrl": "https://www.paynow.co.zw/Payment/..."
  }
}
```
The subscription starts as `TRIAL`. A BullMQ worker polls the Paynow `pollUrl` every 10s.
Once payment is confirmed, status transitions to `ACTIVE` and an FCM push + SMS is sent.
The mobile client polls `GET /subscriptions/me` independently to detect activation.

---

### GET /subscriptions/me
Get the current driver's subscription.

**Auth** required (DRIVER role)

**Response**
```json
{
  "data": {
    "subscription": {
      "plan": "MONTHLY",
      "status": "ACTIVE",
      "currentPeriodEnd": "2026-06-21T09:56:47.393Z"
    }
  }
}
```

---

### PATCH /subscriptions/:id/cancel
Cancel a subscription (downgrades at period end).

**Auth** required (DRIVER role)

---

### GET /subscriptions/upload-url
Get a presigned S3 URL for uploading a driver document.

**Auth** required (DRIVER role)

**Query**
```
fileType=image/jpeg&fileSize=1048576
```

**Response**
```json
{ "data": { "uploadUrl": "https://s3.amazonaws.com/...", "key": "driver-docs/uuid.jpg" } }
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
Get the authenticated driver's full profile including subscription.

**Auth** required (DRIVER role)

---

### PATCH /drivers/me
Update driver profile fields (truck details, document URLs).

**Auth** required (DRIVER role)

---

### PATCH /drivers/me/online
Set driver online and update GPS location. Adds driver to Redis geo index.

**Auth** required (DRIVER role, ACTIVE subscription)

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
      "jobsCompleted": 2,
      "averagePerJob": 515,
      "trendPercent": 12.5,
      "bestDay": { "date": "2026-05-22", "dayOfWeek": "Fri", "earned": 1030, "jobs": 2 },
      "byDay": [ { "date": "2026-05-22", "dayOfWeek": "Fri", "earned": 1030, "jobs": 2 } ],
      "subscriptionCost": 28,
      "netEarned": 1002
    }
  }
}
```

---

## Notifications

### GET /notifications
Returns `[]` for MVP. Push notifications are FCM-only with no persistent inbox.

**Auth** required

---

### PATCH /notifications/:id/read
Mark a notification read (no-op for MVP).

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
Response: `{ stats: { totalUsers, totalDrivers, totalShippers, activeSubscriptions, totalJobs, activeJobs, completedJobsToday, totalRevenue, pendingDocuments } }`

### GET /v1/admin/config
Returns all 22 config keys with their current values, labels, groups, and last-updated metadata.

### PATCH /v1/admin/config
```json
{ "subscription_price_weekly": "9", "bid_ttl_seconds": "360" }
```
Accepts any subset of ConfigKey keys. Invalidates Redis cache for updated keys.

### GET /v1/admin/users
Query: `page`, `limit`, `role` (SHIPPER|DRIVER|BOTH), `search`, `suspended` (boolean)

### PATCH /v1/admin/users/:userId/suspend
```json
{ "reason": "Violation of terms" }
```

### PATCH /v1/admin/users/:userId/unsuspend
No body required.

### GET /v1/admin/drivers
Query: `page`, `limit`, `documentStatus` (PENDING|UNDER_REVIEW|APPROVED|REJECTED|EXPIRED)

### PATCH /v1/admin/drivers/:driverId/approve-docs
No body required. Sets `documentStatus = APPROVED`.

### PATCH /v1/admin/drivers/:driverId/reject-docs
```json
{ "reason": "Licence photo unreadable" }
```
Sets `documentStatus = REJECTED`.

### GET /v1/admin/jobs
Query: `page`, `limit`, `status`

### PATCH /v1/admin/jobs/:jobId/cancel
```json
{ "reason": "Admin forced cancellation" }
```
Cannot cancel jobs already in COMPLETED or CANCELLED state.

### GET /v1/admin/subscriptions
Query: `page`, `limit`, `status` (TRIAL|ACTIVE|EXPIRED|CANCELLED)

### PATCH /v1/admin/subscriptions/:id/override
```json
{ "status": "ACTIVE", "currentPeriodEnd": "2026-06-22T00:00:00.000Z" }
```
`currentPeriodEnd` is optional.
