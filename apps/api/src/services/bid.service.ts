import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getSocketServer } from "@/lib/socket";
import { notifyDriver, notifyShipper } from "./notification.service";
import { transitionJobStatus } from "./job.service";
import { smsMatchConfirmedDriver } from "@/lib/bulkit";
import { getConfigNum } from "@/lib/app-config";

export async function placeBid(jobId: string, driverId: string, offeredPrice: number) {
  const [job, driver] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId }, include: { shipper: { include: { user: true } } } }),
    prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: { user: true, subscription: true },
    }),
  ]);

  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  if (!driver) throw Object.assign(new Error("Driver not found"), { statusCode: 404, code: "DRIVER_NOT_FOUND" });

  if (!driver.subscription || !["ACTIVE", "TRIAL"].includes(driver.subscription.status)) {
    throw Object.assign(new Error("Active subscription required to bid"), {
      statusCode: 403,
      code: "SUBSCRIPTION_REQUIRED",
    });
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

  const [activeBidCount, maxActiveBids] = await Promise.all([
    prisma.bid.count({ where: { driverId, status: { in: ["PENDING", "COUNTERED"] } } }),
    getConfigNum("max_active_bids_per_driver"),
  ]);
  if (activeBidCount >= maxActiveBids) {
    throw Object.assign(new Error(`Maximum ${maxActiveBids} active bids allowed`), {
      statusCode: 400,
      code: "MAX_BIDS_REACHED",
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

  const bid = await prisma.bid.create({
    data: { jobId, driverId, offeredPrice, status: "PENDING" },
    include: { driver: { include: { user: true } } },
  });

  await redis.incr(`loada:job:${jobId}:bid_count`);

  if (job.status === "POSTED") {
    await prisma.job.update({ where: { id: jobId }, data: { status: "BIDDING" } });
  }

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${jobId}`).emit("job:bid_received", { bid, driver: bid.driver });

  await notifyShipper(
    job.shipperId,
    "New Bid Received",
    `New bid: $${offeredPrice} from ${driver.user.name} for your ${job.originAddress} → ${job.destAddress} load.`,
    { jobId, bidId: bid.id },
  );

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

  await notifyDriver(
    bid.driverId,
    "You got the load!",
    `You got the load! Head to pickup at ${bid.job.originAddress}.`,
    { jobId: bid.jobId },
  );

  await smsMatchConfirmedDriver(bid.driver.user.phone, bid.job.originAddress);

  return updatedJob;
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

  return updated;
}

export async function getJobBids(jobId: string) {
  return prisma.bid.findMany({
    where: { jobId },
    orderBy: { offeredPrice: "asc" },
    include: {
      driver: {
        include: {
          user: { select: { id: true, name: true, profilePhotoUrl: true } },
        },
      },
    },
  });
}
