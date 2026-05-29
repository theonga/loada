/**
 * Anti-ghost / anti-stuck job sweep.
 *
 * Two policies, both run by the auto-settle worker:
 *
 *   1. IN_TRANSIT → DELIVERED + commission settlement after N days.
 *      Closes the "driver never confirms delivery to avoid commission" hole.
 *      The driver is already past the GPS gate at pickup, so we know cargo
 *      was loaded; if they never tap "Mark as delivered" we assume the trip
 *      finished and settle.
 *
 *   2. DELIVERED → COMPLETED after N hours when neither party rated.
 *      Closes the "job stays half-complete on dashboards" issue. Commission
 *      was already deducted on the DELIVERED transition, so this is purely
 *      a status tidy-up.
 */

import { prisma } from "./../lib/prisma";
import { getConfigNum } from "./../lib/app-config";
import { deductCommission } from "./wallet.service";
import { notifyDriver, notifyShipper } from "./notification.service";
import { getSocketServer } from "./../lib/socket";

export interface AutoSettleReport {
  inTransitSettled: number;
  deliveredCompleted: number;
  errors: number;
}

export async function runAutoSettleSweep(): Promise<AutoSettleReport> {
  const [inTransitDays, deliveredHours, commissionPct] = await Promise.all([
    getConfigNum("auto_settle_in_transit_days"),
    getConfigNum("auto_complete_delivered_hours"),
    getConfigNum("loada_commission_pct"),
  ]);

  const inTransitCutoff = new Date(Date.now() - inTransitDays * 24 * 60 * 60 * 1000);
  const deliveredCutoff = new Date(Date.now() - deliveredHours * 60 * 60 * 1000);

  let inTransitSettled = 0;
  let deliveredCompleted = 0;
  let errors = 0;

  // ── Stage 1: IN_TRANSIT past cutoff → assume delivered, settle commission
  const stuckJobs = await prisma.job.findMany({
    where: {
      status: "IN_TRANSIT",
      updatedAt: { lt: inTransitCutoff },
    },
    include: {
      bids: { where: { status: "ACCEPTED" }, select: { id: true, driverId: true, commissionAmount: true, offeredPrice: true } },
      delivery: true,
    },
  });

  for (const job of stuckJobs) {
    const accepted = job.bids[0];
    if (!accepted) {
      errors++;
      console.warn("[auto-settle] IN_TRANSIT job has no accepted bid", { jobId: job.id });
      continue;
    }

    const commission = accepted.commissionAmount
      ? parseFloat(accepted.commissionAmount.toString())
      : parseFloat((parseFloat(accepted.offeredPrice.toString()) * commissionPct / 100).toFixed(2));

    try {
      await prisma.$transaction([
        prisma.job.update({
          where: { id: job.id },
          data: { status: "DELIVERED" },
        }),
        prisma.delivery.upsert({
          where: { jobId: job.id },
          create: {
            jobId: job.id,
            deliveredAt: new Date(),
            recipientName: "Auto-settled (no confirmation)",
          },
          update: {
            deliveredAt: job.delivery?.deliveredAt ?? new Date(),
          },
        }),
      ]);

      await deductCommission(accepted.driverId, accepted.id, job.id, commission);
      inTransitSettled++;

      notifyDriver(
        accepted.driverId,
        "Job auto-completed",
        `This trip was idle for ${inTransitDays} days. We've settled the $${commission.toFixed(2)} platform fee and marked it delivered.`,
        { jobId: job.id, screen: "earnings" },
      ).catch(() => {});

      notifyShipper(
        job.shipperId,
        "Job auto-completed",
        `Your driver didn't confirm delivery within ${inTransitDays} days, so we've closed the trip. Open a dispute if this was wrong.`,
        { jobId: job.id },
      ).catch(() => {});

      try {
        const { jobsNs } = getSocketServer();
        jobsNs.to(`job:${job.id}`).emit("job:status_changed", { jobId: job.id, status: "DELIVERED" });
      } catch {
        // socket may not be initialised when this worker first boots
      }
    } catch (err) {
      errors++;
      console.error("[auto-settle] IN_TRANSIT settlement failed", { jobId: job.id, err });
    }
  }

  // ── Stage 2: DELIVERED past cutoff → auto-COMPLETE (rating optional)
  const lingering = await prisma.job.findMany({
    where: {
      status: "DELIVERED",
      updatedAt: { lt: deliveredCutoff },
    },
    select: { id: true },
  });

  for (const { id } of lingering) {
    try {
      await prisma.job.update({ where: { id }, data: { status: "COMPLETED" } });
      deliveredCompleted++;
      try {
        const { jobsNs } = getSocketServer();
        jobsNs.to(`job:${id}`).emit("job:status_changed", { jobId: id, status: "COMPLETED" });
      } catch {
        // ignore
      }
    } catch (err) {
      errors++;
      console.error("[auto-settle] DELIVERED auto-complete failed", { jobId: id, err });
    }
  }

  return { inTransitSettled, deliveredCompleted, errors };
}
