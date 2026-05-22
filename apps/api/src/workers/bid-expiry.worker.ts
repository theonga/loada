import type { Job } from "bullmq";
import { expireBiddingSession } from "@/services/matching.service";

export async function processBidExpiry(job: Job): Promise<void> {
  const { jobId } = job.data as { jobId: string };
  console.info(`[bid-expiry] Processing expiry for job ${jobId}`);
  await expireBiddingSession(jobId);
  console.info(`[bid-expiry] Completed expiry for job ${jobId}`);
}
