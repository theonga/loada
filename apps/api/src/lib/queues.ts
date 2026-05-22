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
export const radiusExpansionQueue = new Queue(QUEUE_NAMES.RADIUS_EXPANSION, connection);
export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, connection);
export const subscriptionRenewalQueue = new Queue(QUEUE_NAMES.SUBSCRIPTION_RENEWAL, connection);
export const subscriptionExpiryQueue = new Queue(QUEUE_NAMES.SUBSCRIPTION_EXPIRY, connection);
export const paynowPollQueue = new Queue(QUEUE_NAMES.PAYNOW_POLL, connection);
