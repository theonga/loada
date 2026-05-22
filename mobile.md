# Loada Mobile App — Claude Code Prompt

## Initial Setup with Mock Data

---

## CRITICAL: Progress tracking — read this before starting and after every interruption

You are working on a large multi-step task. Context windows have limits. Compaction happens.
You must protect your own progress at all times.

**Before starting any step:**

- Write a `PROGRESS.md` file in `apps/mobile/` and keep it updated throughout
- Every time you complete a step or a significant sub-task, update `PROGRESS.md` immediately
- Never assume you will remember where you were — write it down

**`PROGRESS.md` format:**

```markdown
# Loada Mobile — Build Progress

Last updated: [timestamp]

## Status

Current step: [step number and name]
Current sub-task: [exact thing being worked on right now]

## Completed steps

- [x] Step 1 — Project setup
- [x] Step 2 — Design tokens
- [ ] Step 3 — Mock data (IN PROGRESS)
- [ ] Step 4 — Mock service layer
      ...

## Completed screens

- [x] 01 Splash
- [x] 02 Role selection
- [ ] 03 OTP (IN PROGRESS)
      ...

## Completed components

- [x] Avatar
- [x] Chip
- [ ] BidCard (IN PROGRESS)
      ...

## Blockers / decisions made

- [decision 1]
- [decision 2]

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
A step is only marked complete in `PROGRESS.md` when every item in that step is done
and verified. "Mostly done" is not done. Mark partial steps as `(IN PROGRESS)` with a
note on what remains.

---

## Your task

You are building the Loada mobile app. Read `CLAUDE.md` in full before writing a single
line of code. Everything in that file is law — stack choices, file structure, naming
conventions, design tokens, and the never-do list at the bottom.

Scaffold the complete React Native (Expo) mobile app with mock data so every screen is
navigable and visually correct before any backend is connected.

---

## Step 1 — Project setup

Initialize the Expo app inside `apps/mobile/` using Expo SDK with TypeScript template:

```bash
npx create-expo-app mobile --template expo-template-blank-typescript
```

Install all required dependencies in one pass:

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-font
npx expo install react-native-maps react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated
npx expo install @gorhom/bottom-sheet
npx expo install expo-camera expo-image-picker expo-location
npx expo install expo-linear-gradient
npx expo install zustand
npx expo install @react-native-async-storage/async-storage
```

Configure `app.json`:

- `name`: Loada
- `slug`: loada
- `scheme`: loada
- `android.package`: com.loada.app
- `ios.bundleIdentifier`: com.loada.app
- Enable `expo-router` plugin
- Enable `react-native-reanimated` plugin
- Set `userInterfaceStyle` to `dark` only — no light mode support

Configure `babel.config.js` for expo-router and reanimated.

Configure `tsconfig.json` with strict mode and path aliases:

- `@/*` → `./`
- `@components/*` → `./components/*`
- `@constants/*` → `./constants/*`
- `@store/*` → `./store/*`
- `@services/*` → `./services/*`

Update `PROGRESS.md` when done.

---

## Step 2 — Design tokens

Create `constants/theme.ts` with the exact values from `CLAUDE.md` under
"Design system — constants". Do not approximate. Copy them verbatim. This file is
used by every component — get it right before touching anything else.

Also create `constants/index.ts` that exports:

```typescript
export const TONNAGE_TIERS = [1, 2, 5, 10, 20, 30] as const;
export const TONNAGE_LABELS: Record<number, string> = {
  1: "1t",
  2: "2t",
  5: "5t",
  10: "10t",
  20: "20t",
  30: "30t+",
};
export const MAX_ACTIVE_BIDS = 3;
export const BID_TTL_SECONDS = 300;
export const RADIUS_EXPANSION_SECONDS = 60;
export const INITIAL_SEARCH_RADIUS_KM = 25;
export const RADIUS_EXPANSION_KM = 15;
export const MAX_RADIUS_EXPANSIONS = 3;

export enum JobStatus {
  DRAFT = "DRAFT",
  POSTED = "POSTED",
  BIDDING = "BIDDING",
  RADIUS_EXPANDED = "RADIUS_EXPANDED",
  MATCHED = "MATCHED",
  PICKUP_EN_ROUTE = "PICKUP_EN_ROUTE",
  PICKUP_ARRIVED = "PICKUP_ARRIVED",
  LOADED = "LOADED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED",
}

export enum BidStatus {
  PENDING = "PENDING",
  COUNTERED = "COUNTERED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

export enum SubscriptionPlan {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  ANNUAL = "ANNUAL",
}

export enum SubscriptionStatus {
  TRIAL = "TRIAL",
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}
```

Update `PROGRESS.md` when done.

---

## Step 3 — Mock data

Create `services/mock/data.ts` with realistic Zimbabwean data for every entity.
Make it feel real — use real Harare street names, real Zimbabwean truck models,
real routes, real names.

The file must export:

```typescript
export const MOCK_SHIPPER: User;
export const MOCK_DRIVER: User;
export const MOCK_DRIVERS: DriverProfile[]; // minimum 8 drivers
export const MOCK_JOBS: Job[]; // 6 jobs across different statuses
export const MOCK_BIDS: Bid[]; // bids against those jobs
export const MOCK_MESSAGES: Message[]; // a full realistic chat thread
export const MOCK_RATINGS: Rating[];
export const MOCK_SUBSCRIPTION: Subscription;
export const MOCK_EARNINGS: EarningsSummary;
export const MOCK_NOTIFICATIONS: Notification[];
export const MOCK_MARKET_REFERENCE: MarketReference;
```

**Locations to use** (with approximate coordinates):

- Avondale Shops, Harare (-17.7889, 31.0324)
- Workington Industrial, Harare (-17.8456, 30.9876)
- Msasa Industrial, Harare (-17.8234, 31.1023)
- CBD Harare (-17.8252, 31.0335)
- Borrowdale, Harare (-17.7512, 31.0689)
- Beitbridge border post (-22.2167, 30.0025)
- Bulawayo CBD (-20.1500, 28.5833)
- Mutare CBD (-18.9707, 32.6709)
- Marondera (-18.1897, 31.5517)
- Chinhoyi (-17.3667, 30.2000)

**Truck models to use:**

- DAF CF 10t
- Iveco Trakker 12t
- Hino 500 10t
- Volvo FH 20t
- Scania R series 20t
- Scania R series 30t
- Mercedes Actros 10t
- Mercedes Actros 20t
- Isuzu FTR 5t
- Mitsubishi Fuso 2t

**Driver names to use:**
Tatenda Mukamuri, Joseph Khumalo, Rufaro Nyamande, Brighton Chirinda,
Munashe Tafirenyika, Kudakwashe Phiri, Tonderai Moyo, Sibusiso Ndlovu

**Shipper names to use:**
Brian Sibanda, Chiedza Mwangi, Farai Mutasa

**Jobs — include one job in each of these statuses:**
`BIDDING` (active, receiving bids — this is the primary test scenario),
`MATCHED` (driver assigned, en route to pickup),
`IN_TRANSIT` (cargo loaded, heading to destination),
`DELIVERED` (complete, POD available),
`POSTED` (just posted, no bids yet — empty state test),
`COMPLETED` (historical, rated)

**Bids for the BIDDING job** — minimum 4 bids from different drivers at different
prices. The top bid should be flagged as "BEST MATCH". Include at least one
counter-offer state.

**MOCK_MARKET_REFERENCE** for Harare→Beitbridge 10t:

```typescript
{
  route: 'Harare → Beitbridge',
  tonnes: 10,
  periodDays: 30,
  jobCount: 47,
  low: 420,
  median: 465,
  high: 540,
  estimatedMatchMinutes: { min: 4, max: 7 },
}
```

**MOCK_EARNINGS** — 7-day weekly data with realistic variation:

```typescript
{
  weekLabel: 'Mon 13 May – Sun 19 May',
  totalEarned: 1840,
  previousWeekTotal: 1560,
  jobsCompleted: 7,
  totalKm: 2415,
  averagePerJob: 262,
  bestDay: { day: 'Sat', amount: 440 },
  subscriptionCost: 7,
  days: [
    { day: 'Mon', earned: 280 },
    { day: 'Tue', earned: 380 },
    { day: 'Wed', earned: 120 },
    { day: 'Thu', earned: 320 },
    { day: 'Fri', earned: 300 },
    { day: 'Sat', earned: 440 },
    { day: 'Sun', earned: 0 },
  ],
}
```

Update `PROGRESS.md` when done.

---

## Step 4 — Mock service layer

Create `services/mock/index.ts` — async functions that return mock data after a
realistic delay (300–800ms using `setTimeout` wrapped in a Promise).

Every function signature must match what the real API service will use later,
so swapping mock for real is a single import change.

```typescript
// Auth
export async function sendOTP(phone: string): Promise<void>;
export async function verifyOTP(
  phone: string,
  code: string,
): Promise<{ user: User; token: string }>;

// Jobs
export async function getAvailableLoads(driverId: string): Promise<Job[]>;
export async function getJobById(jobId: string): Promise<Job>;
export async function postJob(data: CreateJobInput): Promise<Job>;
export async function cancelJob(jobId: string): Promise<void>;
export async function getShipperJobs(shipperId: string): Promise<Job[]>;

// Bids
export async function placeBid(jobId: string, price: number): Promise<Bid>;
export async function acceptBid(bidId: string): Promise<Job>;
export async function counterBid(bidId: string, price: number): Promise<Bid>;
export async function getJobBids(jobId: string): Promise<Bid[]>;

// Delivery
export async function confirmPickup(
  jobId: string,
  photoUri: string,
): Promise<void>;
export async function confirmDelivery(
  jobId: string,
  photoUri: string,
  recipientName: string,
): Promise<void>;

// Ratings
export async function submitRating(
  jobId: string,
  toUserId: string,
  score: number,
  tags: string[],
): Promise<void>;

// Earnings
export async function getEarningsSummary(
  driverId: string,
): Promise<EarningsSummary>;

// Notifications
export async function getNotifications(userId: string): Promise<Notification[]>;

// Market reference
export async function getMarketReference(
  route: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
  },
  tonnes: number,
): Promise<MarketReference>;
```

In mock mode, `verifyOTP` accepts any 6-digit code and returns `MOCK_DRIVER` or
`MOCK_SHIPPER` depending on which role was selected during onboarding.

Update `PROGRESS.md` when done.

---

## Step 5 — State management

Create three Zustand stores in `store/`:

**`store/auth.store.ts`**

```typescript
interface AuthStore {
  user: User | null;
  role: "shipper" | "driver" | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setRole: (role: "shipper" | "driver") => void;
  logout: () => void;
}
```

**`store/job.store.ts`**

```typescript
interface JobStore {
  activeJob: Job | null;
  bids: Bid[];
  loads: Job[];
  shipperJobs: Job[];
  setActiveJob: (job: Job | null) => void;
  setBids: (bids: Bid[]) => void;
  addBid: (bid: Bid) => void;
  setLoads: (loads: Job[]) => void;
  setShipperJobs: (jobs: Job[]) => void;
}
```

**`store/location.store.ts`**

```typescript
interface LocationStore {
  driverLocation: { lat: number; lng: number; heading?: number } | null;
  isOnline: boolean;
  setDriverLocation: (
    loc: { lat: number; lng: number; heading?: number } | null,
  ) => void;
  setOnline: (online: boolean) => void;
}
```

Update `PROGRESS.md` when done.

---

## Step 6 — Shared component library

Build every component listed below. All components go in `components/ui/`.
Each gets its own file. Reference `designs/ui.jsx` and the relevant screen files
for exact visual spec. Use only values from `constants/theme.ts` — no hardcoded
colors, sizes, or radii anywhere.

Update `PROGRESS.md` after each component is complete. Do not batch them — mark
each one individually so progress is never lost.

### Components to build (in this order):

**`Eyebrow.tsx`** — `Text` with fontSize 11, fontWeight 600, color
`Colors.text.secondary`, letterSpacing 1.2, textTransform uppercase. Simplest
component, build first to confirm theme imports work.

**`Chip.tsx`** — accepts `variant?: 'default' | 'amber' | 'green' | 'red' | 'blue'`
and `children`. Uses `ChipVariants` from theme. Border radius 4. Height 24.
Padding horizontal 8.

**`Pill.tsx`** — accepts `active?: boolean`, `onPress`, `children`. Border radius 999.
Height 36. Padding horizontal 14. Active: accent background + dark text. Inactive:
elevated background + secondary text.

**`TonnagePicker.tsx`** — accepts `value: number`, `onChange: (t: number) => void`.
Horizontal FlatList of Pill components, one per `TONNAGE_TIERS` entry. Shows
`TONNAGE_LABELS[tier]` as the label.
`showsHorizontalScrollIndicator={false}`. `horizontal={true}`.

**`Avatar.tsx`** — accepts `name: string`, `size: number`. Generates initials from
first letter of first and last word of name. Background `Colors.background.elevated`.
Border 1px `Colors.background.divider`. Text white, weight 600, fontSize size \* 0.35.

**`Stars.tsx`** — accepts `rating: number`, `count?: number`, `size?: number`.
Renders filled star icons in amber. Shows rating number and optional count in
tabular nums, secondary text color.

**`StatusBadge.tsx`** — accepts `status: JobStatus`. Small colored dot + text label.
Map each status to a color from the status palette and a human-readable label:

- POSTED / BIDDING / RADIUS_EXPANDED → amber + "Waiting for bids"
- MATCHED / PICKUP_EN_ROUTE / PICKUP_ARRIVED → accent + "Driver on the way"
- LOADED / IN_TRANSIT → blue + "In transit"
- DELIVERED / COMPLETED → green + "Delivered"
- CANCELLED → red + "Cancelled"
- DISPUTED → red + "Disputed"

**`ProgressBar.tsx`** — accepts `pct: number` (0–100). Height 2. Background
`Colors.background.divider`. Accent fill. No animation needed — static render.

**`CountdownBar.tsx`** — accepts `expiresAt: Date`. Extends `ProgressBar` but
calculates live percentage using `setInterval` every second. Turns red when under
60 seconds remaining. Cleans up interval on unmount.

**`Skeleton.tsx`** — accepts `width`, `height`, `borderRadius?`. Animated shimmer
placeholder using `Animated.loop` + `Animated.timing` on opacity between
`Colors.background.card` and `Colors.background.elevated`.

**`MapPin.tsx`** — accepts `kind: 'me' | 'driver' | 'load' | 'origin' | 'dest'`,
`label?: string`, `scale?: number`. In mock mode this renders as an SVG-style View
(not on a real MapView). Sizes and colors per the design spec.

**`RouteLine.tsx`** — accepts `from` and `to` as `{ x: number; y: number }`. Renders
a thin line between two points. In mock/placeholder map context only.

**`ImgBox.tsx`** — accepts `width`, `height`, `label?: string`, `borderRadius?`.
Diagonal stripe placeholder using LinearGradient with two close dark grays
(#1A1A1A and #161616 at 135deg). Label centered in tertiary text, 10px monospace.

**`MapBg.tsx`** — a dark background View that simulates a map in mock mode.
`Colors.background.card` fill. Subtle grid lines (thin Views, `Colors.background.divider`
color, opacity 0.4) at regular intervals to suggest map tiles. Full width and height.

**`BottomSheet.tsx`** — thin wrapper around `@gorhom/bottom-sheet`. Dark background
handle (`Colors.background.divider`, 36×4, centered, border radius 2). Card background
`Colors.background.card`. Accepts `snapPoints`, `children`.

**`BidCard.tsx`** — the most complex component. Accepts a `Bid` object plus
`isBestMatch?: boolean`, `onAccept`, `onCounter`, `onSkip`. Must render:

- Optional "BEST MATCH" badge (accent dot + amber label, 10px 600 weight letter-spaced)
- Avatar (initials, 44px)
- Driver name (14px 600 weight)
- Stars + review count
- Years on platform
- Truck model + capacity chip (amber chip)
- Truck photo (ImgBox 48×36)
- Bid price in 700 weight 22px tabular nums right-aligned
- Time since bid in tertiary text
- Three action buttons: Accept (green bg, dark text), Counter (ghost), Skip (icon X)
- Best match card: accent border, 4% amber tinted background
- Reference `ScBidInboxA` in `designs/screens-shipper.jsx` exactly

**`LoadCard.tsx`** — accepts a `Job` object and `onPress`. Must render:

- Origin → destination with arrow icon
- Distance + cargo description (12px secondary, tabular)
- Asking price right-aligned, 700 weight 20px tabular
- Tonnage chip (amber)
- Special requirement chips
- Bid count (amber and competitive if > 2, gray if low, "no bids yet" if 0)
- Time posted (tertiary)
- Reference `ScDriverLoads` in `designs/screens-driver.jsx` exactly

**`MarketReferenceWidget.tsx`** — accepts `data: MarketReference`, `userPrice: number`.
This is a key competitive differentiator — implement it precisely.

- Header: "MARKET REFERENCE" eyebrow + route + period subtitle + trending-up icon
- Range track: full-width View, 4px height, `Colors.background.elevated` color
- Accent-colored fill from low% to high% of track width
- Two circle endpoints at low and high positions (16×16, accent, 3px card-colored border)
- Vertical white price marker at user's price position (2×24 View)
- "YOU" label below marker in 10px white 600 weight
- Three stat columns below: LOW / MEDIAN (with job count) / HIGH in tabular nums
- Divider
- Zap icon + "Likely to match in X–Y min at your price" in secondary text
- Reference `ScPostPricing` in `designs/screens-shipper.jsx` exactly

**`EarningsBar.tsx`** — accepts `data: { value: number }[]` and `average: number`.
Mini bar chart. Heights proportional to max value. Amber bars (borderRadius 2).
Dollar amount above each bar in 11px tabular secondary text. Average line shown below.
Reference `ScPlaceBid` in `designs/screens-driver.jsx` exactly.

Update `PROGRESS.md` after every single component. This step has the highest risk
of compaction — track every item.

---

## Step 7 — Navigation structure

Set up Expo Router with this exact layout. Create every file — even if it only renders
a placeholder View with the screen name in text. Getting the navigation shell right
is more important than screen content at this step.

```
app/
├── _layout.tsx              # Root: fonts, gesture handler, safe area, auth redirect
├── (auth)/
│   ├── _layout.tsx          # Stack navigator, no tab bar
│   ├── index.tsx            # Role selection
│   ├── phone.tsx            # Phone number entry
│   ├── otp.tsx              # OTP verification
│   └── driver-setup/
│       ├── personal.tsx
│       ├── vehicle.tsx
│       ├── documents.tsx
│       └── paywall.tsx
├── (shipper)/
│   ├── _layout.tsx          # Tab navigator: Home, Jobs, Chat, Profile
│   ├── index.tsx
│   ├── post/
│   │   ├── route.tsx
│   │   ├── cargo.tsx
│   │   ├── pricing.tsx
│   │   └── confirm.tsx
│   ├── bids/
│   │   └── [jobId].tsx
│   ├── match/
│   │   └── [jobId].tsx
│   ├── tracking/
│   │   └── [jobId].tsx
│   ├── delivery/
│   │   └── [jobId].tsx
│   ├── rate/
│   │   └── [jobId].tsx
│   ├── jobs/
│   │   └── index.tsx
│   └── profile/
│       └── index.tsx
├── (driver)/
│   ├── _layout.tsx          # Tab navigator: Home, Loads, Earnings, Profile
│   ├── index.tsx
│   ├── loads/
│   │   ├── index.tsx
│   │   └── [jobId].tsx
│   ├── bid/
│   │   └── [jobId].tsx
│   ├── match/
│   │   └── [jobId].tsx
│   ├── active/
│   │   ├── en-route.tsx
│   │   ├── pickup.tsx
│   │   ├── in-transit.tsx
│   │   └── complete.tsx
│   ├── earnings/
│   │   └── index.tsx
│   ├── documents/
│   │   └── index.tsx
│   ├── subscription/
│   │   └── index.tsx
│   └── profile/
│       └── index.tsx
└── (shared)/
    ├── chat/
    │   └── [jobId].tsx
    ├── notifications.tsx
    ├── help.tsx
    └── settings.tsx
```

Root `_layout.tsx` auth logic:

- If not authenticated → redirect to `/(auth)`
- If authenticated as shipper → redirect to `/(shipper)`
- If authenticated as driver → redirect to `/(driver)`

In `__DEV__` mode: pre-populate the auth store with `MOCK_SHIPPER` so the app
opens directly on the shipper home screen without going through auth. Add a comment
explaining how to switch to driver mode using the dev switcher (Step 9).

Update `PROGRESS.md` when every file is created and navigation is confirmed working.

---

## Step 8 — Build all 30 screens

Build every screen pixel-accurate to the design. Work through them in order.
Update `PROGRESS.md` after every screen — not after batches of screens.

For each screen:

1. Find the corresponding function in the designs JSX file in `designs/`
2. Translate every element to React Native
3. Replace inline mock data with imports from `services/mock/data.ts`
4. Wire all navigation: every button that navigates must call `router.push()`
   or `router.back()` with the correct path
5. Wire state: read from Zustand stores where appropriate

### CSS → React Native translation rules

| CSS                                     | React Native                                                 |
| --------------------------------------- | ------------------------------------------------------------ |
| `display: flex; flex-direction: column` | default (no style needed)                                    |
| `display: flex; flex-direction: row`    | `flexDirection: 'row'`                                       |
| `flex: 1`                               | `flex: 1`                                                    |
| `gap: N`                                | `gap: N`                                                     |
| `border-radius: N`                      | `borderRadius: N`                                            |
| `overflow: hidden`                      | `overflow: 'hidden'`                                         |
| `position: absolute; inset: 0`          | `position: 'absolute', top: 0, left: 0, right: 0, bottom: 0` |
| `backdropFilter: blur(N)`               | not supported — use semi-transparent bg color                |
| `letter-spacing: N`                     | `letterSpacing: N`                                           |
| `font-variant-numeric: tabular-nums`    | `fontVariant: ['tabular-nums']`                              |
| `text-transform: uppercase`             | `textTransform: 'uppercase'`                                 |
| `white-space: nowrap`                   | `numberOfLines={1}` on Text                                  |
| `text-overflow: ellipsis`               | `ellipsizeMode="tail"` on Text                               |
| `backdrop-filter`                       | semi-transparent `backgroundColor` only                      |
| `box-shadow`                            | not used — elevation through bg color stepping only          |

### Special implementations

**MapBg** — in mock mode: `MapBg` component (built in Step 6). Do not use the real
`react-native-maps` `MapView` yet. That comes when the location service is wired.

**ImgBox** — use the `ImgBox` component (built in Step 6). All image placeholders
use this until real images are wired.

**Camera screens (22, driver delivery proof)** — render a mock camera view using
`ImgBox` with the accent corner bracket overlay. Do not activate the real camera yet.

**Bottom sheets** — use the `BottomSheet` component (built in Step 6) wrapping
`@gorhom/bottom-sheet`. Snap points per screen:

- Load detail (screen 18): `['72%']`
- Counter modal (screen 30): `['52%']`
- Tracking sheet (screen 13): `['40%', '65%']`

**Bid inbox tabs (screens 10 + 11)** — both views live in `bids/[jobId].tsx`.
Use a local state toggle (`useState`) to switch between list view and terminal view.
Two pill buttons at the top switch between them.

**Screen 09 pricing** — the large price input with cursor blink: use a `TextInput`
styled to match. The cursor blink comes for free. The `MarketReferenceWidget`
sits below it.

**Screen 29 empty bids** — the pulsing concentric rings: use `Animated.loop` on
three `View` circles with `borderWidth` and amber border color, scaling from 1 to 1.15
with staggered delays.

**Screen 12 / 20 match confirmed flash** — on mount, run a 200ms `Animated.timing`
on a full-screen View from opacity 0.8 → 0, using `Colors.accent` background.

### Screens build order

Build in this order — auth first, then shipper flow, then driver flow, then shared.

**Auth (5 screens):**
01 Role selection, 02 Phone entry (design simply: country code + number input + CTA),
03 OTP, 04 Driver documents, 05 Paywall

**Shipper flow (10 screens):**
06 Shipper home, 07 Post route, 08 Post cargo, 09 Post pricing,
10+11 Bid inbox (list + terminal toggle in one file), 12 Match confirmed,
13 Tracking, 14 POD, 15 Rate driver

**Post-load confirm screen** (not in original 30 — build simply):
Summary card showing route, cargo, tonnage, price, and a "Post load" CTA.

**Driver flow (9 screens):**
16 Driver home, 17 Loads list, 18 Load detail, 19 Place bid,
20 Driver match confirmed, 21 En route to pickup, 22 Cargo loaded,
23 Job complete, 24 Earnings dashboard

**Shared screens (6 screens):**
25 Chat, 26 Notifications, 27 Driver profile, 28 Help, 29 Empty bids, 30 Counter modal

**Missing screens — build simply, no design file:**

- Shipper profile: avatar + name + stats + edit profile button
- Driver job history: list of past jobs using `LoadCard` variant
- En route to delivery: same as screen 21 but destination is dropoff address
- Delivery proof capture — driver: same as screen 22 but for dropoff + signature field
- Settings: notification toggles, language (English/Shona/Ndebele), logout, delete account
- Subscription management: current plan, renewal date, payment method, billing history

Update `PROGRESS.md` after every single screen. This is the longest step — careful tracking
is essential.

---

## Step 9 — Dev mode switcher

Add a floating dev panel — only renders when `__DEV__` is true. Position it as a
small semi-transparent pill at the bottom-right of every screen (above the tab bar
if present). It must not block any production UI elements.

Tapping the pill opens a modal with:

```
[ LOADA DEV MODE ]

Current user: Tatenda Mukamuri (Driver)
            or
Current user: Brian Sibanda (Shipper)

[ Switch to Shipper ]  or  [ Switch to Driver ]

Active job status:
[ BIDDING ] [ MATCHED ] [ IN_TRANSIT ] [ DELIVERED ] [ POSTED ]

[ Reset mock data ]    [ Close ]
```

Switching role: updates the auth store, then navigates to the appropriate tab group root.

Switching job status: updates `MOCK_JOBS[0].status` in the store so screens that read
the active job show the chosen state immediately.

Implement as a component `components/dev/DevPanel.tsx` and add it to the root
`_layout.tsx` so it appears on every screen without adding it to every screen file.

Update `PROGRESS.md` when done.

---

## Step 10 — Verify

Run through this checklist. Fix anything that fails before marking the task complete.

**Navigation:**

- [ ] App opens on shipper home screen in dev mode without auth flow
- [ ] Shipper flow: Home → Post (4 steps) → Bid inbox → Match → Tracking → POD → Rate → back to home
- [ ] Driver flow: Home → Loads list → Load detail → Place bid → Match → En route → Pickup → In transit → Complete → Earnings
- [ ] Tab bars work on both shipper and driver sides
- [ ] Back navigation works on every stack screen
- [ ] Dev panel role switcher navigates correctly

**Components:**

- [ ] `TonnagePicker` scrolls horizontally, selection state updates correctly
- [ ] `MarketReferenceWidget` renders range bar and user price marker correctly
- [ ] `CountdownBar` ticks down in real time, turns red under 60 seconds
- [ ] `BidCard` renders all three button states (accept, counter, skip)
- [ ] `BidCard` best match variant shows amber border and BEST MATCH badge
- [ ] `EarningsBar` renders proportional bars with dollar amounts
- [ ] `BottomSheet` opens and closes with gesture on load detail and counter modal
- [ ] `Skeleton` placeholder animates on screens with loading states
- [ ] `Avatar` shows correct initials for all mock driver names
- [ ] `Stars` renders correctly at all sizes used across screens

**Design fidelity:**

- [ ] Background is `#0A0A0A` on every screen — no white flashes
- [ ] Accent color `#F5A623` appears only on: primary CTAs, active states, key prices, TTL bar
- [ ] All prices and numbers use tabular nums
- [ ] All touch targets are minimum 48×48
- [ ] No drop shadows anywhere
- [ ] Card surfaces are `#141414`, elevated surfaces are `#1E1E1E`
- [ ] Bid inbox terminal view (screen 11) stats strip shows BIDS / LOW / MED / HIGH / TTL

**Mock data:**

- [ ] Bid inbox shows minimum 4 realistic bids with different drivers, prices, and truck models
- [ ] Load list shows 5+ loads with realistic Zimbabwean routes
- [ ] Chat shows a realistic thread with image placeholder and timestamps
- [ ] Notifications are grouped by job with correct icons
- [ ] Earnings screen shows correct weekly total and bar chart
- [ ] Driver profile shows document expiry warning on the registration doc

**Final:**

- [ ] `npx expo start` launches without errors
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No `any` types in any file
- [ ] `PROGRESS.md` is fully up to date with all items marked complete

---

## What this is not

Do not wire real APIs. Do not set up Socket.IO. Do not use real Google Maps tiles.
Do not implement real camera capture. Do not set up push notifications.
All of that comes in the next phase.

This phase is: every screen looks correct, every navigation works, powered entirely
by mock data.

---

## When you are done

1. Update `PROGRESS.md` — mark every item complete
2. Run `npx expo start` and confirm the app launches cleanly
3. Run `npx tsc --noEmit` and confirm zero TypeScript errors
4. Write a brief summary at the bottom of `PROGRESS.md` noting:
   - Any screens where the design translation was difficult
   - Any components that needed significant deviation from the design file
   - Any missing design decisions that were made during build (document them)
   - Recommended first priorities for the next phase (real API wiring)
