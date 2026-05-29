import type { Job } from "bullmq";
import { runAutoSettleSweep } from "@/services/auto-settle.service";

export async function processAutoSettle(_job: Job): Promise<void> {
  const report = await runAutoSettleSweep();
  console.info(
    `[auto-settle] sweep complete — settled ${report.inTransitSettled} in-transit, completed ${report.deliveredCompleted} delivered, errors ${report.errors}`,
  );
}
