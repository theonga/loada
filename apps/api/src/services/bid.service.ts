import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getSocketServer } from "@/lib/socket";
import { notifyDriver, notifyShipper } from "./notification.service";
import { transitionJobStatus } from "./job.service";
import { smsMatchConfirmedDriver } from "@/lib/bulkit";
import { getConfigNum } from "@/lib/app-config";
import { reserveCommission, releaseCommission } from "./wallet.service";

const ACTIVE_JOB_STATUSES = ["MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT"] as const;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function placeBid(jobId: string, driverId: string, offeredPrice: number) {
  const [job, driver, commissionPct] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId }, include: { shipper: { include: { user: true } } } }),
    prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: { user: true },
    }),
    getConfigNum("loada_commission_pct"),
  ]);

  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  if (!driver) throw Object.assign(new Error("Driver not found"), { statusCode: 404, code: "DRIVER_NOT_FOUND" });

  // Self-trade gate: a user with BOTH role could otherwise post a job as
  // shipper and bid on it as driver, then accept their own bid. Even though
  // commission is still charged, this inflates platform stats with fake
  // activity, lets users launder wallet funds out as "earnings", and pollutes
  // ratings. Reject it here at the source.
  if (driver.user.id === job.shipper.user.id) {
    throw Object.assign(
      new Error("You can't bid on your own job."),
      { statusCode: 400, code: "SELF_TRADE_FORBIDDEN" },
    );
  }

  if (driver.documentStatus !== "APPROVED") {
    throw Object.assign(new Error("Documents must be approved before bidding"), {
      statusCode: 403,
      code: "DOCUMENTS_NOT_APPROVED",
    });
  }

  if (driver.capacityTonnes < job.requiredTonnes) {
    throw Object.assign(
      new Error(`Your truck capacity (${driver.capacityTonnes}t) is less than required (${job.requiredTonnes}t)`),
      { statusCode: 400, code: "INSUFFICIENT_CAPACITY" },
    );
  }

  const [activeBidCount, maxActiveBids, activeJobCount] = await Promise.all([
    prisma.bid.count({ where: { driverId, status: { in: ["PENDING", "COUNTERED"] } } }),
    getConfigNum("max_active_bids_per_driver"),
    prisma.job.count({ where: { matchedDriverId: driverId, status: { in: [...ACTIVE_JOB_STATUSES] } } }),
  ]);

  if (activeJobCount > 0) {
    throw Object.assign(
      new Error("Complete your current active job before bidding on new ones"),
      { statusCode: 400, code: "ACTIVE_JOB_IN_PROGRESS" },
    );
  }

  if (activeBidCount >= maxActiveBids) {
    throw Object.assign(new Error(`Maximum ${maxActiveBids} active bids allowed`), {
      statusCode: 400,
      code: "MAX_BIDS_REACHED",
    });
  }

  const existingBid = await prisma.bid.findFirst({
    where: { jobId, driverId, status: { in: ["PENDING", "COUNTERED"] } },
  });
  if (existingBid) {
    throw Object.assign(new Error("You already have an active bid on this job"), {
      statusCode: 400,
      code: "DUPLICATE_BID",
    });
  }

  if (job.biddingExpiresAt && job.biddingExpiresAt < new Date()) {
    throw Object.assign(new Error("Bidding has expired for this job"), {
      statusCode: 400,
      code: "BIDDING_EXPIRED",
    });
  }

  if (!["POSTED", "BIDDING", "RADIUS_EXPANDED"].includes(job.status)) {
    throw Object.assign(new Error("Job is not accepting bids"), { statusCode: 400, code: "JOB_NOT_ACCEPTING_BIDS" });
  }

  // Calculate commission and reserve from wallet before creating bid
  const commissionAmount = parseFloat((offeredPrice * commissionPct / 100).toFixed(2));

  // This throws INSUFFICIENT_WALLET_BALANCE if the driver cannot cover the commission
  await reserveCommission(driverId, "pending", jobId, commissionAmount);

  const bid = await prisma.bid.create({
    data: { jobId, driverId, offeredPrice, status: "PENDING", commissionAmount },
    include: { driver: { include: { user: true } } },
  });

  // Update the wallet transaction with the real bidId now that we have it
  const wallet = await prisma.driverWallet.findUnique({ where: { driverId } });
  if (wallet) {
    await prisma.walletTransaction.updateMany({
      where: { walletId: wallet.id, bidId: "pending", jobId, type: "COMMISSION_RESERVE" },
      data: { bidId: bid.id },
    });
  }

  await redis.incr(`loada:job:${jobId}:bid_count`);

  if (job.status === "POSTED") {
    await prisma.job.update({ where: { id: jobId }, data: { status: "BIDDING" } });
  }

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${jobId}`).emit("job:bid_received", { bid, driver: bid.driver });

  notifyShipper(
    job.shipperId,
    "New Bid Received",
    `New bid: $${offeredPrice} from ${driver.user.name} for your ${job.originAddress} → ${job.destAddress} load.`,
    { jobId, bidId: bid.id },
  ).catch((err) => console.error("[placeBid] notification error (non-fatal):", err));

  return bid;
}

export async function acceptBid(bidId: string, shipperUserId: string) {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { job: { include: { shipper: true } }, driver: { include: { user: true } } },
  });

  if (!bid) throw Object.assign(new Error("Bid not found"), { statusCode: 404, code: "BID_NOT_FOUND" });
  if (bid.job.shipper.userId !== shipperUserId) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, code: "FORBIDDEN" });
  }
  if (!["BIDDING", "RADIUS_EXPANDED"].includes(bid.job.status)) {
    throw Object.assign(new Error("Job is no longer accepting bid acceptance"), {
      statusCode: 400,
      code: "INVALID_JOB_STATUS",
    });
  }

  const [updatedJob] = await prisma.$transaction([
    prisma.job.update({
      where: { id: bid.jobId },
      data: {
        status: "MATCHED",
        matchedDriverId: bid.driverId,
        matchedBidId: bid.id,
      },
      include: { shipper: { include: { user: true } } },
    }),
    prisma.bid.update({ where: { id: bidId }, data: { status: "ACCEPTED" } }),
    prisma.bid.updateMany({
      where: { jobId: bid.jobId, id: { not: bidId }, status: { in: ["PENDING", "COUNTERED"] } },
      data: { status: "REJECTED" },
    }),
  ]);

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${bid.jobId}`).emit("job:matched", {
    job: updatedJob,
    driver: bid.driver,
    bid,
  });
  // Also notify the matched driver on their personal room — the driver hasn't
  // subscribed to the job room yet (they had no reason to), so without this
  // the driver's pending-bid screen would have to poll until the next push.
  jobsNs.to(`driver:${bid.driverId}`).emit("job:matched", {
    job: updatedJob,
    bid,
  });

  const shipperName = updatedJob.shipper.user.name;

  // Notifications are fire-and-forget — match is already committed above
  Promise.all([
    notifyDriver(
      bid.driverId,
      "You got the load!",
      `${shipperName} accepted your bid! Head to pickup at ${bid.job.originAddress}.`,
      { jobId: bid.jobId },
    ),
    smsMatchConfirmedDriver(bid.driver.user.phone, bid.job.originAddress),
  ]).catch((err) => console.error("[acceptBid] notification error (non-fatal):", err));

  return updatedJob;
}

export async function rejectBid(bidId: string, shipperUserId: string) {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { job: { include: { shipper: { include: { user: true } } } } },
  });

  if (!bid) throw Object.assign(new Error("Bid not found"), { statusCode: 404, code: "BID_NOT_FOUND" });
  if (bid.job.shipper.userId !== shipperUserId) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, code: "FORBIDDEN" });
  }
  if (!["PENDING", "COUNTERED"].includes(bid.status)) {
    throw Object.assign(new Error("Bid cannot be rejected in its current state"), {
      statusCode: 400,
      code: "INVALID_BID_STATUS",
    });
  }

  const updated = await prisma.bid.update({ where: { id: bidId }, data: { status: "REJECTED" } });

  // Release reserved commission back to driver's available balance
  if (bid.commissionAmount) {
    const commissionAmt = parseFloat(bid.commissionAmount.toString());
    releaseCommission(bid.driverId, bidId, commissionAmt, "Bid rejected by shipper").catch(() => {});
  }

  // Notify driver their bid was rejected
  notifyDriver(
    bid.driverId,
    "Bid rejected",
    `${bid.job.shipper.user.name} passed on your bid for the ${bid.job.originAddress} → ${bid.job.destAddress ?? ""} load.`,
    { jobId: bid.jobId },
  ).catch(() => {});

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${bid.jobId}`).emit("job:bid_status_updated", { bid: updated });
  jobsNs.to(`driver:${bid.driverId}`).emit("job:bid_status_updated", { bid: updated });

  return updated;
}

export async function counterBid(bidId: string, userId: string, newPrice: number) {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { job: { include: { shipper: true } }, driver: { include: { user: true } } },
  });

  if (!bid) throw Object.assign(new Error("Bid not found"), { statusCode: 404, code: "BID_NOT_FOUND" });

  const isShipper = bid.job.shipper.userId === userId;
  const isDriver = bid.driver.userId === userId;
  if (!isShipper && !isDriver) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, code: "FORBIDDEN" });
  }

  const updated = await prisma.bid.update({
    where: { id: bidId },
    data: { offeredPrice: newPrice, status: "COUNTERED" },
  });

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${bid.jobId}`).emit("job:bid_status_updated", { bid: updated });
  jobsNs.to(`driver:${bid.driverId}`).emit("job:bid_status_updated", { bid: updated });

  return updated;
}

export async function getMyBids(driverId: string) {
  return prisma.bid.findMany({
    where: { driverId, status: { in: ["PENDING", "COUNTERED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      job: true,
    },
  });
}

export async function getJobBids(jobId: string) {
  const [job, bids] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId }, select: { originLat: true, originLng: true } }),
    prisma.bid.findMany({
      where: { jobId },
      orderBy: { offeredPrice: "asc" },
      include: {
        driver: {
          include: {
            user: { select: { id: true, name: true, profilePhotoUrl: true } },
          },
        },
      },
    }),
  ]);

  if (!job) return [];

  return bids.map((bid) => {
    const lat = bid.driver.lastLocationLat;
    const lng = bid.driver.lastLocationLng;
    let distanceKm: number | null = null;
    let etaMinutes: number | null = null;
    if (lat != null && lng != null) {
      distanceKm = Math.round(haversineKm(lat, lng, job.originLat, job.originLng));
      etaMinutes = Math.round((distanceKm / 60) * 60);
    }
    return { ...bid, distanceKm, etaMinutes };
  });
}
