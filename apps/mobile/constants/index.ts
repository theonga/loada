export const TONNAGE_TIERS = [1, 2, 5, 10, 20, 30] as const;
export const TONNAGE_LABELS: Record<number, string> = {
  1: '1t',
  2: '2t',
  5: '5t',
  10: '10t',
  20: '20t',
  30: '30t+',
};
export const MAX_ACTIVE_BIDS = 3;
export const BID_TTL_SECONDS = 300;
export const RADIUS_EXPANSION_SECONDS = 60;
export const INITIAL_SEARCH_RADIUS_KM = 25;
export const RADIUS_EXPANSION_KM = 15;
export const MAX_RADIUS_EXPANSIONS = 3;

export enum JobStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  BIDDING = 'BIDDING',
  RADIUS_EXPANDED = 'RADIUS_EXPANDED',
  MATCHED = 'MATCHED',
  PICKUP_EN_ROUTE = 'PICKUP_EN_ROUTE',
  PICKUP_ARRIVED = 'PICKUP_ARRIVED',
  LOADED = 'LOADED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  EXPIRED = 'EXPIRED',
}

export enum BidStatus {
  PENDING = 'PENDING',
  COUNTERED = 'COUNTERED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum SubscriptionPlan {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
