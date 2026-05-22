import type { Job } from "bullmq";
import { expandSearchRadius } from "@/services/matching.service";

export async function processRadiusExpansion(job: Job): Promise<void> {
  const { jobId } = job.data as { jobId: string };
  console.info(`[radius-expansion] Expanding radius for job ${jobId}`);
  await expandSearchRadius(jobId);
  console.info(`[radius-expansion] Done for job ${jobId}`);
}
