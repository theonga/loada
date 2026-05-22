# Loada — Design Audit & Handoff Notes

Audited against: design prompt, CLAUDE.md spec, and competitive differentiation goals.
Screens reviewed: 30 across onboarding, shipper flow, driver flow, shared/utility.

---

## Overall verdict

The designs are production-ready. The visual language is consistent, the dark theme is
correct throughout, and the key differentiators from InDrive/Uber are all implemented
on screen — not just in the spec. A few additions are needed before handoff to dev.

---

## Design tokens — extracted from styles.css

These are the canonical values. Update `apps/mobile/constants/theme.ts` to match exactly.

```typescript
export const Colors = {
  background: {
    primary: "#0A0A0A", // --bg
    card: "#141414", // --card
    elevated: "#1E1E1E", // --elev
    divider: "#2A2A2A", // --divider
  },
  accent: "#F5A623", // --accent (electric amber — confirmed)
  text: {
    primary: "#FFFFFF", // --text
    secondary: "#8A8A8A", // --text-2
    tertiary: "#4A4A4A", // --text-3
  },
  status: {
    green: "#00C853", // --green  (confirmed / online / delivered)
    amber: "#FFB300", // --amber  (warning / expiring)
    red: "#F44336", // --red    (cancelled / error)
    blue: "#2196F3", // --blue   (info / refrigerated chip)
  },
} as const;

export const Typography = {
  font: "Inter", // confirmed — not DM Sans, Inter was chosen
  weights: {
    light: 300, // timestamps, metadata
    regular: 400, // body copy
    medium: 500, // labels, names
    semibold: 600, // headings, CTAs, buttons
    bold: 700, // prices, key numbers
  },
  sizes: {
    heroPrice: 72, // bid input, asking price (the Bloomberg moment)
    largePrice: 48, // earnings total
    price: 32, // load detail price, match confirmed price
    heading: 22, // screen headings
    title: 18, // card titles
    body: 14, // standard body
    label: 12, // secondary info
    eyebrow: 11, // section labels, uppercase tracking
    micro: 10, // timestamps, map labels
  },
} as const;

export const Spacing = {
  screenH: 20, // horizontal screen padding
  card: 16, // card internal padding
  gap: 12, // standard gap between cards
  tight: 8, // tight gaps (chips, pills)
} as const;

export const Radius = {
  pill: 999, // tonnage pills, status chips
  card: 12, // cards, bottom sheets
  button: 8, // buttons, inputs
  chip: 4, // cargo chips (OVERSIZED, FRAGILE etc.)
  avatar: 999, // always circular
} as const;

export const Components = {
  buttonHeight: 52, // primary, ghost, dark buttons
  inputHeight: 52, // all text inputs
  appbarHeight: 62, // top bar (statusbar 44 + appbar content)
  tabbarHeight: 76, // bottom nav (includes home indicator space)
  pillHeight: 36, // tonnage picker pills
  chipHeight: 24, // inline cargo chips
  handleWidth: 36, // bottom sheet drag handle
  handleHeight: 4,
  touchMin: 48, // minimum touch target
} as const;
```

---

## Screen inventory — complete map to Expo Router paths

All 30 screens accounted for. Mapped to file paths per the monorepo structure.

### Onboarding (5 screens)

| Screen           | Label | Expo Router path                        |
| ---------------- | ----- | --------------------------------------- |
| Splash           | 01    | `app/(auth)/index.tsx`                  |
| Role selection   | 02    | `app/(auth)/role.tsx`                   |
| OTP verification | 03    | `app/(auth)/otp.tsx`                    |
| Driver documents | 04    | `app/(auth)/driver-setup/documents.tsx` |
| Driver paywall   | 05    | `app/(auth)/driver-setup/paywall.tsx`   |

Note: Phone number entry screen is missing from the designs — it's referenced
in the OTP screen ("we sent a code to +263 77…") but the input screen itself
wasn't designed. Add before dev starts. Should be: country code + number field,
Continue CTA. Simple single-focus screen.

### Shipper flow (10 screens)

| Screen                    | Label | Expo Router path                              |
| ------------------------- | ----- | --------------------------------------------- |
| Shipper home (map)        | 06    | `app/(shipper)/index.tsx`                     |
| Post load — route         | 07    | `app/(shipper)/post/route.tsx`                |
| Post load — cargo         | 08    | `app/(shipper)/post/cargo.tsx`                |
| Post load — pricing       | 09    | `app/(shipper)/post/pricing.tsx`              |
| Bid inbox — list view     | 10    | `app/(shipper)/bids/[jobId].tsx`              |
| Bid inbox — terminal view | 11    | `app/(shipper)/bids/[jobId].tsx` (tab toggle) |
| Match confirmed           | 12    | `app/(shipper)/match/[jobId].tsx`             |
| Active job tracking       | 13    | `app/(shipper)/tracking/[jobId].tsx`          |
| Proof of delivery         | 14    | `app/(shipper)/delivery/[jobId].tsx`          |
| Rate driver               | 15    | `app/(shipper)/rate/[jobId].tsx`              |

Missing shipper screens to design:

- Post load step 4 — Review & confirm (`app/(shipper)/post/confirm.tsx`)
- Shipper job history list (`app/(shipper)/jobs/index.tsx`)
- Awaiting driver acceptance (between screen 12 and match) (`app/(shipper)/bids/awaiting.tsx`)

### Driver flow (9 screens)

| Screen                     | Label | Expo Router path                   |
| -------------------------- | ----- | ---------------------------------- |
| Driver home (map)          | 16    | `app/(driver)/index.tsx`           |
| Available loads list       | 17    | `app/(driver)/loads/index.tsx`     |
| Load detail (bottom sheet) | 18    | `app/(driver)/loads/[jobId].tsx`   |
| Place bid                  | 19    | `app/(driver)/bid/[jobId].tsx`     |
| Driver match confirmed     | 20    | `app/(driver)/match/[jobId].tsx`   |
| En route to pickup         | 21    | `app/(driver)/active/en-route.tsx` |
| Confirm cargo loaded       | 22    | `app/(driver)/active/pickup.tsx`   |
| Job complete               | 23    | `app/(driver)/active/complete.tsx` |
| Driver earnings dashboard  | 24    | `app/(driver)/earnings/index.tsx`  |

Missing driver screens to design:

- Bid status screen (after submitting — shows pending/counter-received state)
- En route to delivery (same as 21 but destination is dropoff)
- Delivery proof capture (driver's side — photo + recipient signature)
- Driver job history list
- Driver documents management screen

### Shared / utility (6 screens)

| Screen                | Label | Expo Router path                               |
| --------------------- | ----- | ---------------------------------------------- |
| In-app chat           | 25    | `app/(shared)/chat/[jobId].tsx`                |
| Notifications centre  | 26    | `app/(shared)/notifications.tsx`               |
| Driver profile        | 27    | `app/(driver)/profile/index.tsx`               |
| Help & support        | 28    | `app/(shared)/help.tsx`                        |
| Empty state — no bids | 29    | Component in `components/job/EmptyBids.tsx`    |
| Counter-offer modal   | 30    | Component in `components/job/CounterModal.tsx` |

Missing shared screens to design:

- Shipper profile screen (only driver profile was designed)
- Settings screen
- Issue reporting flow (accessible from tracking screen)
- Driver suspension notice
- Driver onboarding status screen (document pipeline visibility)

---

## What's excellent — keep exactly as designed

**Bid inbox terminal view (screen 11)** — the Bloomberg-style ranked table with
LOW / MED / HIGH / TTL stats strip is a genuine product innovation. No competitor
has this. Keep it pixel-perfect. The `ScBidInboxB` implementation is the reference.

**Market reference widget (screen 09)** — the range bar showing Low / Median / High
with the user's price marked and "Likely to match in 4–7 min" is the single most
important differentiator on the shipper side. This is what makes Loada better than
InDrive for shippers. Ship this in MVP, not v2.

**Driver earnings reference on bid screen (screen 19)** — showing the driver's last
5 earnings on the same route as a bar chart, with their average, is what makes Loada
better than InDrive for drivers. The $465 bid with "−$15 vs asking · $0.80/km" label
is exactly right.

**Shipper trust card on load detail (screen 18)** — "Verified shipper · 47 jobs posted"
with aggregate driver rating visible before a driver commits to bidding. Keep this.

**Job complete net breakdown (screen 23)** — showing Earned / Fuel est. / Tolls / Net
is something no competitor does. Drivers can see their actual take-home. Keep it.

**Empty bids pulse animation (screen 29)** — the concentric amber ring with truck icon
communicates "the system is working" rather than "nothing is happening". The
"Raise asking price by $20" shortcut is smart UX. Keep both.

**Subscription transparency on earnings (screen 24)** — the small card showing
"Earned $1,840 · paid direct by shippers · subscription $7 this week" makes the
business model feel honest. Keep it visible on every earnings screen.

---

## Issues to fix before dev

### 1. Tab bar labels missing (minor)

The CSS has `.tabbar .tab` with a label below the icon but all tab components in the
designs render icon-only. The design prompt said icon-only. Confirm the final decision
and update `TabBar` component accordingly. Current implementation is icon-only — fine.

### 2. Paywall has 3 tiers (design) vs CLAUDE.md which says weekly/monthly only

Screen 05 (Paywall) shows Weekly / Monthly / Annual. CLAUDE.md specifies
"weekly or monthly subscription fee". Decision needed:

- If keeping Annual: add `ANNUAL` to `SubscriptionPlan` enum in Prisma schema
- If dropping Annual: simplify the paywall to 2 cards

Recommendation: keep Annual — it improves LTV and the "SAVE 32% · BEST" badge
will convert well. Update CLAUDE.md and Prisma schema.

### 3. Post-load confirm screen (step 4 of 4) is missing

The progress bar goes 25% → 50% → 75% → (missing). The review and confirm screen
before final submission needs to be designed. Should show: route summary, cargo,
tonnage, special requirements, asking price, and the "Post load" final CTA.

### 4. Font — Inter confirmed, not DM Sans

The CSS imports Inter. Update CLAUDE.md and theme.ts to specify Inter only.
Remove DM Sans as an alternative.

### 5. Bottom sheet `position: absolute` vs flow

The sheet component uses `position: absolute` over the map. In React Native this
maps to `position: 'absolute'` with `bottom: 0`. Use `react-native-bottom-sheet`
library (Gorhom) for production — it handles gesture, snap points, and keyboard
avoidance that the static design doesn't need to worry about but the app does.

---

## Component extraction list

These are the shared components visible across screens. Build these first
before building individual screens.

| Component                                                | Used in screens                      | Notes                            |
| -------------------------------------------------------- | ------------------------------------ | -------------------------------- |
| `<Statusbar/>`                                           | All                                  | Time, battery, signal            |
| `<TabBar role="shipper\|driver" active="..."/>`          | Home screens                         | 4 tabs each role                 |
| `<MapBg variant="a\|b\|c"/>`                             | Map screens                          | Dark tile placeholder            |
| `<MapPin kind="me\|driver\|load\|origin\|dest" label?/>` | Map screens                          | Amber/white pins                 |
| `<RouteLine a b dashed?/>`                               | Route screens                        | SVG line between pins            |
| `<Avatar name size/>`                                    | Bid cards, profile, chat             | Initials circle                  |
| `<Stars rating count? size/>`                            | Bid cards, profile, load detail      |                                  |
| `<TonnagePicker value onChange/>`                        | Post cargo, driver setup             | Horizontal pill scroll           |
| `<BidCard bid onAccept onCounter onSkip/>`               | Bid inbox                            | The core shipper card            |
| `<LoadCard load onPress/>`                               | Load list                            | The core driver card             |
| `<ImgBox w h label radius/>`                             | POD, truck photo, chat               | Striped placeholder → real image |
| `<ProgressBar pct/>`                                     | Post-load flow, bid TTL              | Thin amber bar                   |
| `<BottomSheet/>`                                         | Load detail, counter modal, tracking | Wraps Gorhom                     |
| `<Eyebrow/>`                                             | Section labels                       | 11px uppercase 600 weight        |
| `<Chip variant="amber\|green\|red\|blue\|default"/>`     | Cargo chips                          | 4px radius                       |
| `<Pill active?>`                                         | Tonnage picker, sort filter          | 999px radius                     |
| `<CountdownBar expiresAt/>`                              | Bid inbox                            | Live TTL depletion               |
| `<MarketReferenceWidget route tonnes/>`                  | Post pricing                         | The differentiator widget        |
| `<EarningsBar data/>`                                    | Place bid, earnings screen           | Mini bar chart                   |

---

## Screens still needed before MVP launch

Priority order:

1. Phone number entry (auth flow blocker)
2. Shipper profile screen
3. Post load — step 4 review & confirm
4. Driver bid status screen (pending / counter-received states)
5. En route to delivery (same pattern as screen 21, different destination)
6. Delivery proof capture — driver (photo + e-signature)
7. Driver job history list
8. Issue reporting flow (3 screens)
9. Settings screen
10. Driver onboarding status (document pipeline)

Lower priority (can ship post-launch):

- Dispute screen
- Referral screen
- Driver suspension screen
- Shipper wallet / payment history

---

## Notes for the dev team

**Gorhom Bottom Sheet** — install `@gorhom/bottom-sheet` for all sheet interactions.
Configure snap points: `['72%', '40%']` for load detail, `['50%']` for counter modal.

**Expo MapView** — use `react-native-maps` with Google Maps provider. Apply the
`mapStyle` JSON for dark mode tiles (Google Maps "night" preset or custom Snazzy Maps
dark style). The map in the designs is a placeholder — it will be a real `<MapView>`.

**`react-native-camera` / Expo Camera** — screens 22 (cargo loaded) and the delivery
proof screen use camera capture with corner bracket overlay. The corner brackets in the
design are purely CSS — replicate in React Native using 4 absolutely-positioned `<View>`
elements with border styles.

**Tabular nums** — the `className="num"` in the designs maps to
`fontVariant: ['tabular-nums']` in React Native StyleSheet. Apply this to every price,
distance, ETA, rating, and timestamp.

**`react-native-linear-gradient`** — the match confirmed screen uses a radial/linear
amber gradient overlay. Use this library for that screen only.

**Animations** — the empty bids pulse rings and the match confirmed flash use CSS
animations in the design. In React Native use `Animated.loop` + `Animated.timing` for
the rings, and a quick `Animated.sequence` flash on match confirmed.
