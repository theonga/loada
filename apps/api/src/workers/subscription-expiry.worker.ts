import type { Job } from "bullmq";
import { suspendExpiredDrivers } from "@/services/subscription.service";

export async function processSubscriptionExpiry(_job: Job): Promise<void> {
  console.info("[subscription-expiry] Suspending expired drivers");
  await suspendExpiredDrivers();
  console.info("[subscription-expiry] Done");
}
