import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { bidExpiryQueue, radiusExpansionQueue, notificationQueue } from "@/lib/queues";
import { getSocketServer } from "@/lib/socket";
import { getConfigNum } from "@/lib/app-config";
import { notifyDriver, notifyShipper } from "./notification.service";
import { releaseCommission, deductCommission } from "./wallet.service";
import type { JobStatus, ShipperPaymentMethod, TruckType } from "@prisma/client";

const ACTIVE_JOB_STATUSES: JobStatus[] = [
  "MATCHED",
  "PICKUP_EN_ROUTE",
  "PICKUP_ARRIVED",
  "LOADED",
  "IN_TRANSIT",
];

const VALID_TRANSITIONS: Partial<Record<JobStatus, JobStatus[]>> = {
  POSTED: ["BIDDING", "CANCELLED"],
  BIDDING: ["RADIUS_EXPANDED", "MATCHED", "CANCELLED", "EXPIRED"],
  RADIUS_EXPANDED: ["MATCHED", "CANCELLED", "EXPIRED"],
  MATCHED: ["PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "CANCELLED"],
  PICKUP_EN_ROUTE: ["PICKUP_ARRIVED", "CANCELLED"],
  PICKUP_ARRIVED: ["LOADED", "IN_TRANSIT", "CANCELLED"],
  LOADED: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED"],
  DELIVERED: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  CANCELLED: [],
  DISPUTED: ["COMPLETED", "CANCELLED"],
  EXPIRED: [],
};

export interface CreateJobInput {
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  cargoDescription: string;
  requiredTonnes: number;
  specialRequirements: string[];
  askingPrice: number;
  currency: string;
  requiredTruckType?: TruckType;
  paymentMethod?: ShipperPaymentMethod;
}

export async function createJob(shipperId: string, data: CreateJobInput) {
  const activeJob = await prisma.job.findFirst({
    where: { shipperId, status: { in: ACTIVE_JOB_STATUSES } },
  });
  if (activeJob) {
    throw Object.assign(
      new Error("You already have an active job. Complete or cancel it before posting a new one."),
      { statusCode: 400, code: "ACTIVE_JOB_EXISTS" },
    );
  }

  const [bidTtl, expansionInterval] = await Promise.all([
    getConfigNum("bid_ttl_seconds"),
    getConfigNum("radius_expansion_interval_seconds"),
  ]);
  const biddingExpiresAt = new Date(Date.now() + bidTtl * 1000);

  const job = await prisma.job.create({
    data: {
      shipperId,
      ...data,
      askingPrice: data.askingPrice,
      status: "POSTED",
      biddingExpiresAt,
    },
  });

  await Promise.all([
    bidExpiryQueue.add("expire", { jobId: job.id }, { delay: bidTtl * 1000 }),
    radiusExpansionQueue.add("expand", { jobId: job.id }, { delay: expansionInterval * 1000 }),
    notificationQueue.add("notify", {
      type: "nearby_drivers",
      jobId: job.id,
      title: "New Load Available",
      body: `${job.requiredTonnes}t load from ${job.originAddress} to ${job.destAddress}`,
    }),
  ]);

  return job;
}

export async function getAvailableLoads(driverId: string, lat: number, lng: number) {
  const driver = await prisma.driverProfile.findUnique({
    where: { id: driverId },
  });
  if (!driver) throw Object.assign(new Error("Driver not found"), { statusCode: 404, code: "DRIVER_NOT_FOUND" });

  const jobs = await prisma.$queryRaw<
    Array<{
      id: string;
      originAddress: string;
      destAddress: string;
      requiredTonnes: number;
      requiredTruckType: string;
      paymentMethod: string;
      askingPrice: string;
      currency: string;
      status: JobStatus;
      biddingExpiresAt: Date | null;
      originLat: number;
      originLng: number;
      destLat: number;
      destLng: number;
      specialRequirements: string[];
      cargoDescription: string;
      searchRadiusKm: number;
      shipperId: string;
      matchedDriverId: string | null;
      matchedBidId: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>
  >`
    SELECT j.*,
      ST_Distance(
        ST_SetSRID(ST_Point(j."originLng", j."originLat"), 4326)::geography,
        ST_SetSRID(ST_Point(${lng}, ${lat}), 4326)::geography
      ) / 1000 AS distance_km
    FROM "Job" j
    WHERE j.status IN ('POSTED', 'BIDDING', 'RADIUS_EXPANDED')
      AND j."requiredTonnes" <= ${driver.capacityTonnes}
      AND (j."biddingExpiresAt" IS NULL OR j."biddingExpiresAt" AT TIME ZONE 'UTC' > NOW())
    ORDER BY distance_km ASC
    LIMIT 50
  `;

  return jobs;
}

export async function getJobById(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      bids: { include: { driver: { include: { user: true } } } },
      delivery: true,
      messages: { include: { sender: true } },
      ratings: true,
      shipper: { include: { user: true } },
    },
  });
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  return job;
}

type CancelCtx =
  | { actor: "shipper" }
  | { actor: "admin"; adminUsername: string; reason: string };

const ACTIVE_OR_BIDDING: JobStatus[] = [
  "POSTED", "BIDDING", "RADIUS_EXPANDED",
  "MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT",
];

/**
 * Statuses where the driver has clearly started doing real work — they've
 * arrived at pickup, loaded the cargo, or are mid-trip. Cancelling here means
 * Loada keeps the commission (driver got paid for the run by some mechanism;
 * we don't get to claw back what's already been earned).
 */
const POST_PICKUP_STATUSES: JobStatus[] = [
  "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT", "DELIVERED",
];

/**
 * Shared cleanup for any job cancellation:
 *   - mark CANCELLED + reject every pending/countered/accepted bid
 *   - clear the Redis bid-session cache key
 *   - release reserved commissions back to each bidder's wallet
 *   - notify the matched driver (if any) so their UI updates
 *   - emit job:status_changed so live screens update
 *
 * Callers (shipper cancelJob, adminCancelJob) handle their own permission
 * checks before invoking this.
 */
async function performJobCancellation(
  job: {
    id: string;
    status: JobStatus;
    shipperId: string;
    shipper: { user: { name: string } };
    bids: Array<{ id: string; driverId: string; commissionAmount: import("@prisma/client").Prisma.Decimal | null; status: import("@prisma/client").BidStatus }>;
  },
  ctx: CancelCtx,
): Promise<void> {
  if (["COMPLETED", "CANCELLED"].includes(job.status)) {
    throw Object.assign(new Error("Cannot cancel a completed or already cancelled job"), {
      statusCode: 400,
      code: "INVALID_STATUS",
    });
  }

  const wasMatched = (["MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT", "DELIVERED"] as JobStatus[]).includes(job.status);
  const wasPostPickup = POST_PICKUP_STATUSES.includes(job.status);

  // Commission release policy:
  //  - Pre-pickup (POSTED..PICKUP_EN_ROUTE): refund every reserved commission.
  //    Driver hasn't moved cargo, no work performed.
  //  - Post-pickup (PICKUP_ARRIVED+): the ACCEPTED bid's commission is either
  //    deducted now (we treat the trip as completed) or stays reserved until
  //    an admin makes a call. Either way it does NOT get auto-refunded. This
  //    closes the "shipper cancels DELIVERED to bail the driver out" hole.
  //    Non-accepted bids' commissions are always refundable.
  const refundAllCommissions = !wasPostPickup;

  await prisma.job.update({ where: { id: job.id }, data: { status: "CANCELLED" } });
  await prisma.bid.updateMany({
    where: { jobId: job.id, status: { in: ["PENDING", "COUNTERED", "ACCEPTED"] } },
    data:  { status: "REJECTED" },
  });
  await redis.del(`loada:job:${job.id}:status`);

  const releaseReason = ctx.actor === "admin"
    ? `Job force-cancelled by admin (${ctx.adminUsername})`
    : wasMatched
      ? "Job cancelled by shipper after match"
      : "Job cancelled by shipper";

  // Fire-and-forget — wallet release failures shouldn't block the cancellation.
  for (const bid of job.bids) {
    if (!bid.commissionAmount) continue;

    const amount = parseFloat(bid.commissionAmount.toString());
    const isAcceptedBid = bid.status === "ACCEPTED";

    if (refundAllCommissions) {
      releaseCommission(bid.driverId, bid.id, amount, releaseReason).catch(() => {});
    } else if (!isAcceptedBid) {
      // The losing bids never did any work — they always get refunded.
      releaseCommission(bid.driverId, bid.id, amount, releaseReason).catch(() => {});
    } else {
      // Accepted bid + post-pickup cancel: settle the commission as if the
      // job completed. Loada keeps its cut, the reserved balance moves out.
      // If this fails the reservation stays — an admin can manually release
      // it from the wallet page if needed.
      deductCommission(bid.driverId, bid.id, job.id, amount).catch((err) => {
        console.error("[performJobCancellation] post-pickup settlement failed", { jobId: job.id, bidId: bid.id, err });
      });
    }

    if (wasMatched && isAcceptedBid) {
      const title = "Job cancelled";
      const refundCopy = refundAllCommissions
        ? "Your reserved balance has been returned."
        : "Because the cargo had already been picked up, the platform fee was settled rather than refunded — contact support if this is wrong.";
      const body = ctx.actor === "admin"
        ? `An admin cancelled this job. Reason: ${ctx.reason}. ${refundCopy}`
        : `${job.shipper.user.name} cancelled the job. ${refundCopy}`;
      notifyDriver(bid.driverId, title, body, { jobId: job.id }).catch(() => {});
    }
  }

  // Tell the shipper too on admin cancellations — they didn't initiate it.
  if (ctx.actor === "admin") {
    notifyShipper(
      job.shipperId,
      "Your job was cancelled",
      `An admin force-cancelled your job. Reason: ${ctx.reason}`,
      { jobId: job.id },
    ).catch(() => {});
  }

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${job.id}`).emit("job:status_changed", { jobId: job.id, status: "CANCELLED" });
}

export async function cancelJob(jobId: string, userId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      shipper: { include: { user: true } },
      bids: {
        where: { status: { in: ["PENDING", "COUNTERED", "ACCEPTED"] } },
        select: { id: true, driverId: true, commissionAmount: true, status: true },
      },
    },
  });
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  if (job.shipper.userId !== userId) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, code: "FORBIDDEN" });
  }

  // Shippers can only cancel pre-pickup. Once the driver has arrived at the
  // pickup point (status PICKUP_ARRIVED or beyond), cancellation must go
  // through the dispute / admin flow. This closes the collusion path where
  // shipper + driver agreed to "cancel" a delivered job to refund commission.
  if (POST_PICKUP_STATUSES.includes(job.status)) {
    throw Object.assign(
      new Error("This job can't be cancelled — the driver has already arrived at pickup. Contact support to open a dispute."),
      { statusCode: 400, code: "POST_PICKUP_NO_SHIPPER_CANCEL" },
    );
  }

  await performJobCancellation(job, { actor: "shipper" });
}

/**
 * Admin force-cancel — bypasses the shipper-ownership check but runs the same
 * cleanup as a shipper cancel: reserved commissions are released, bids are
 * rejected, both parties are notified, the live socket event fires.
 */
export async function adminCancelJob(
  jobId: string,
  adminUsername: string,
  reason: string,
): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      shipper: { include: { user: true } },
      bids: {
        where: { status: { in: ["PENDING", "COUNTERED", "ACCEPTED"] } },
        select: { id: true, driverId: true, commissionAmount: true, status: true },
      },
    },
  });
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  await performJobCancellation(job, { actor: "admin", adminUsername, reason });
}

/**
 * Bulk variant — runs each cancellation independently so a single bad id
 * doesn't take down the rest of the batch. Returns counts so the admin UI
 * can report partial success.
 */
export async function adminBulkCancelJobs(
  jobIds: string[],
  adminUsername: string,
  reason: string,
): Promise<{ cancelled: number; skipped: number }> {
  let cancelled = 0;
  let skipped = 0;
  for (const jobId of jobIds) {
    try {
      await adminCancelJob(jobId, adminUsername, reason);
      cancelled++;
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Already-terminal jobs and missing rows are expected — don't blow up.
      if (code === "INVALID_STATUS" || code === "JOB_NOT_FOUND") {
        skipped++;
      } else {
        throw err;
      }
    }
  }
  return { cancelled, skipped };
}

// Keep the active-status constant export-friendly for routes that need it.
void ACTIVE_OR_BIDDING;

export async function getShipperJobs(shipperId: string, status?: string) {
  return prisma.job.findMany({
    where: {
      shipperId,
      ...(status ? { status: status as JobStatus } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { bids: true, delivery: true },
  });
}

export async function getDriverActiveJobs(driverId: string) {
  return prisma.job.findMany({
    where: {
      matchedDriverId: driverId,
      status: { in: ["MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"] as JobStatus[] },
    },
    orderBy: { updatedAt: "desc" },
    include: { bids: true, delivery: true, shipper: { include: { user: true } } },
  });
}

export async function transitionJobStatus(jobId: string, newStatus: JobStatus) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });

  const allowed = VALID_TRANSITIONS[job.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(`Cannot transition from ${job.status} to ${newStatus}`),
      { statusCode: 400, code: "INVALID_TRANSITION" },
    );
  }

  const updated = await prisma.job.update({ where: { id: jobId }, data: { status: newStatus } });

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${jobId}`).emit("job:status_changed", { jobId, status: newStatus });

  return updated;
}
