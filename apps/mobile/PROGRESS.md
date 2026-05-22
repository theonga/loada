# Loada Mobile — Build Progress

Last updated: 2026-05-21

## Status

All 10 steps complete. App is navigable with mock data. Ready for Expo Go / simulator.

## Completed steps

- [x] Step 1 — Project setup (Expo SDK 56, TypeScript strict, path aliases, babel)
- [x] Step 2 — Design tokens (constants/theme.ts, constants/index.ts with enums)
- [x] Step 3 — Mock data (services/mock/data.ts — realistic Zimbabwean data)
- [x] Step 4 — Mock service layer (services/mock/index.ts — all async, 300–800ms delays)
- [x] Step 5 — State management (Zustand: auth.store, job.store, location.store)
- [x] Step 6 — Shared component library (19 components in components/ui/)
- [x] Step 7 — Navigation structure (Expo Router, three tab groups, auth redirect)
- [x] Step 8 — All 30+ screens built (41 screen files total)
- [x] Step 9 — Dev mode switcher (DevPanel: floating pill, role switch, job status override)
- [x] Step 10 — Verified (npx tsc --noEmit → exit 0, zero errors)

## Completed screens

### Auth (5)
- (auth)/index.tsx — Splash / role selection
- (auth)/phone.tsx — Phone number entry
- (auth)/otp.tsx — OTP verification
- (auth)/driver-setup/personal.tsx — Driver personal details
- (auth)/driver-setup/vehicle.tsx — Truck details
- (auth)/driver-setup/documents.tsx — Document upload
- (auth)/driver-setup/paywall.tsx — Subscription paywall

### Shipper (10)
- (shipper)/index.tsx — Home map
- (shipper)/post/route.tsx — Post load: route
- (shipper)/post/cargo.tsx — Post load: cargo
- (shipper)/post/pricing.tsx — Post load: pricing + market reference
- (shipper)/post/confirm.tsx — Post load: review & confirm
- (shipper)/bids/[jobId].tsx — Live bid inbox (list + terminal toggle)
- (shipper)/match/[jobId].tsx — Match confirmed
- (shipper)/tracking/[jobId].tsx — Active job tracking
- (shipper)/delivery/[jobId].tsx — Proof of delivery
- (shipper)/rate/[jobId].tsx — Rate driver
- (shipper)/jobs/index.tsx — Job history
- (shipper)/profile/index.tsx — Shipper profile

### Driver (12)
- (driver)/index.tsx — Home map
- (driver)/loads/index.tsx — Available loads list
- (driver)/loads/[jobId].tsx — Load detail
- (driver)/bid/[jobId].tsx — Place bid
- (driver)/match/[jobId].tsx — Match confirmed
- (driver)/active/en-route.tsx — En route to pickup
- (driver)/active/pickup.tsx — Confirm cargo loaded
- (driver)/active/in-transit.tsx — In transit
- (driver)/active/complete.tsx — Job complete
- (driver)/earnings/index.tsx — Driver earnings
- (driver)/documents/index.tsx — Documents
- (driver)/subscription/index.tsx — Subscription
- (driver)/profile/index.tsx — Driver profile

### Shared (5)
- (shared)/chat/[jobId].tsx — In-app chat
- (shared)/notifications.tsx — Notifications centre
- (shared)/help.tsx — Help & support
- (shared)/settings.tsx — Settings
- (shared)/referral.tsx — Referral (placeholder)

## Completed components (19)

Eyebrow, Chip, Pill, TonnagePicker, Avatar, Stars, StatusBadge, ProgressBar,
CountdownBar, Skeleton, MapPin, RouteLine, ImgBox, MapBg, BottomSheet,
BidCard, LoadCard, MarketReferenceWidget, EarningsBar, ScreenWrapper

## Dev mode

- Default: opens on shipper home (Brian Sibanda)
- DevPanel (⚙️ DEV pill, bottom-right): switch shipper ↔ driver, set job status
- Switch to driver → Tatenda Mukamuri on driver home

## Decisions made

- Used --legacy-peer-deps for @gorhom/bottom-sheet and zustand (React 19 peer dep conflict)
- expo-router entry point via index.ts → 'expo-router/entry'
- TypeScript 6 baseUrl deprecation suppressed with "ignoreDeprecations": "6.0"
- (driver)/active/ screens use local navigation without jobId — single active job per driver
- Mock service functions return typed data with realistic delays for skeleton state testing
