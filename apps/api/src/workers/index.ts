import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { QUEUE_NAMES } from "@/lib/queues";
import { processBidExpiry } from "./bid-expiry.worker";
import { processRadiusExpansion } from "./radius-expansion.worker";
import { processNotification } from "./notification.worker";
import { processPaynowPoll } from "./paynow-poll.worker";

export function startWorkers(): void {
  const connection = { connection: redis };

  new Worker(QUEUE_NAMES.BID_EXPIRY, processBidExpiry, { ...connection, concurrency: 5 });
  new Worker(QUEUE_NAMES.RADIUS_EXPANSION, processRadiusExpansion, { ...connection, concurrency: 5 });
  new Worker(QUEUE_NAMES.NOTIFICATION, processNotification, { ...connection, concurrency: 10 });
  new Worker(QUEUE_NAMES.PAYNOW_POLL, processPaynowPoll, { ...connection, concurrency: 10 });

  console.info("All BullMQ workers started");
}
