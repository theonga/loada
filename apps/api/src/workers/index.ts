import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { QUEUE_NAMES, autoSettleQueue } from "@/lib/queues";
import { processBidExpiry } from "./bid-expiry.worker";
import { processRadiusExpansion } from "./radius-expansion.worker";
import { processNotification } from "./notification.worker";
import { processPaynowPoll } from "./paynow-poll.worker";
import { processAutoSettle } from "./auto-settle.worker";

const AUTO_SETTLE_REPEAT_NAME = "hourly-sweep";

export async function startWorkers(): Promise<void> {
  const connection = { connection: redis };

  new Worker(QUEUE_NAMES.BID_EXPIRY, processBidExpiry, { ...connection, concurrency: 5 });
  new Worker(QUEUE_NAMES.RADIUS_EXPANSION, processRadiusExpansion, { ...connection, concurrency: 5 });
  new Worker(QUEUE_NAMES.NOTIFICATION, processNotification, { ...connection, concurrency: 10 });
  new Worker(QUEUE_NAMES.PAYNOW_POLL, processPaynowPoll, { ...connection, concurrency: 10 });
  new Worker(QUEUE_NAMES.AUTO_SETTLE, processAutoSettle, { ...connection, concurrency: 1 });

  // Schedule the auto-settle sweep to run hourly. BullMQ's repeat config is
  // idempotent — re-adding the same `jobId` won't create duplicates, so this
  // is safe to call on every boot.
  await autoSettleQueue.add(
    "sweep",
    {},
    {
      jobId: AUTO_SETTLE_REPEAT_NAME,
      repeat: { pattern: "0 * * * *" }, // top of every hour
    },
  );

  console.info("All BullMQ workers started (auto-settle scheduled hourly)");
}
