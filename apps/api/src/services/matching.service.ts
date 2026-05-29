import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { radiusExpansionQueue, notificationQueue } from "@/lib/queues";
import { getSocketServer } from "@/lib/socket";
import { getNearbyDrivers } from "./location.service";
import { getConfigNum } from "@/lib/app-config";
import { releaseCommission } from "./wallet.service";
import { notifyDriver } from "./notification.service";

export async function expandSearchRadius(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || !["POSTED", "BIDDING", "RADIUS_EXPANDED"].includes(job.status)) return;

  const [maxExpansions, expansionKm, expansionIntervalSeconds] = await Promise.all([
    getConfigNum("radius_expansion_max_count"),
    getConfigNum("radius_expansion_increment_km"),
    getConfigNum("radius_expansion_interval_seconds"),
  ]);

  const bidCount = await prisma.bid.count({
    where: { jobId, status: { in: ["PENDING", "COUNTERED"] } },
  });
  if (bidCount >= 3) return;

  const expansionCountKey = `loada:job:${jobId}:expansions`;
  const expansionCount = parseInt((await redis.get(expansionCountKey)) ?? "0", 10);

  if (expansionCount >= maxExpansions) {
    await notificationQueue.add("notify", {
      type: "shipper",
      userId: job.shipperId,
      jobId,
      title: "No drivers found nearby",
      body: "We couldn't find drivers in your area. Try reposting with a higher asking price.",
    });
    return;
  }

  const oldRadius = job.searchRadiusKm;
  const newRadius = oldRadius + expansionKm;

  await prisma.job.update({
    where: { id: jobId },
    data: { searchRadiusKm: newRadius, status: "RADIUS_EXPANDED" },
  });

  await redis.incr(expansionCountKey);
  await redis.expire(expansionCountKey, 3600);

  const allDriversInNewRadius = await getNearbyDrivers(job.originLat, job.originLng, newRadius, job.requiredTonnes);
  const oldDrivers = await getNearbyDrivers(job.originLat, job.originLng, oldRadius, job.requiredTonnes);
  const oldDriverIds = new Set(oldDrivers.map((d) => d.id));
  const newDrivers = allDriversInNewRadius.filter((d) => !oldDriverIds.has(d.id));

  for (const driver of newDrivers) {
    await notificationQueue.add("notify", {
      type: "driver",
      userId: driver.id,
      jobId,
      title: "New Load Nearby",
      body: `A ${job.requiredTonnes}t load from ${job.originAddress} to ${job.destAddress} is available.`,
    });
  }

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${jobId}`).emit("job:radius_expanded", { jobId, newRadiusKm: newRadius });

  await radiusExpansionQueue.add("expand", { jobId }, { delay: expansionIntervalSeconds * 1000 });
}

export async function expireBiddingSession(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || !["POSTED", "BIDDING", "RADIUS_EXPANDED"].includes(job.status)) return;

  // Fetch pending bids to release their reserved commissions
  const pendingBids = await prisma.bid.findMany({
    where: { jobId, status: { in: ["PENDING", "COUNTERED"] } },
    select: { id: true, driverId: true, commissionAmount: true },
  });

  await prisma.$transaction([
    prisma.job.update({ where: { id: jobId }, data: { status: "EXPIRED" } }),
    prisma.bid.updateMany({
      where: { jobId, status: { in: ["PENDING", "COUNTERED"] } },
      data: { status: "EXPIRED" },
    }),
  ]);

  // Release all reserved commissions (non-blocking)
  for (const bid of pendingBids) {
    if (bid.commissionAmount) {
      releaseCommission(
        bid.driverId,
        bid.id,
        parseFloat(bid.commissionAmount.toString()),
        "Bid expired — job got no match",
      ).catch(() => {});
    }
  }

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${jobId}`).emit("job:expired", { jobId });

  await notificationQueue.add("notify", {
    type: "shipper",
    userId: job.shipperId,
    jobId,
    title: "No match found",
    body: "Your load didn't get matched. Repost to try again.",
  });

  // Notify drivers who received the new_load push but never placed a bid
  notifyUnactioned(jobId).catch(() => {});
}

/**
 * Sweep for any jobs whose bidding window has elapsed but were never expired.
 *
 * Per-job expiry is normally driven by a BullMQ delayed task scheduled at
 * job-creation time. That task can be lost if Redis is flushed or the worker
 * is down at the moment it should fire, leaving the job stuck in POSTED /
 * BIDDING / RADIUS_EXPANDED forever (and showing the wrong status in admin).
 *
 * This sweep is the backstop: it processes every overdue job through the same
 * expireBiddingSession() helper so behaviour matches a normal expiry exactly
 * (status flip, bids rejected, reserved commissions released, sockets emitted,
 * notifications sent).
 *
 * Returns the number of jobs swept.
 */
export async function sweepExpiredBiddingSessions(): Promise<number> {
  const overdue = await prisma.job.findMany({
    where: {
      status: { in: ["POSTED", "BIDDING", "RADIUS_EXPANDED"] },
      biddingExpiresAt: { lt: new Date() },
    },
    select: { id: true },
  });
  if (overdue.length === 0) return 0;

  // Process sequentially — each call writes to the same wallets/notifications
  // pipeline and we'd rather log clean diagnostics than thrash the DB.
  let swept = 0;
  for (const { id } of overdue) {
    try {
      await expireBiddingSession(id);
      swept++;
    } catch (err) {
      console.error("[sweepExpiredBiddingSessions] failed for", id, err);
    }
  }
  return swept;
}

async function notifyUnactioned(jobId: string): Promise<void> {
  // Find all userIds who got the new_load notification for this job
  const notified = await prisma.notification.findMany({
    where: { jobId, type: "new_load" },
    select: { userId: true },
  });
  if (notified.length === 0) return;

  const notifiedUserIds = notified.map((n) => n.userId);

  // Find all drivers who placed any bid on this job
  const bidders = await prisma.bid.findMany({
    where: { jobId },
    include: { driver: { select: { userId: true } } },
  });
  const bidderUserIds = new Set(bidders.map((b) => b.driver.userId));

  // Resolve driverProfile ids for notified users who never bid
  const unactioned = await prisma.driverProfile.findMany({
    where: {
      userId: { in: notifiedUserIds.filter((uid) => !bidderUserIds.has(uid)) },
    },
    select: { id: true },
  });
  if (unactioned.length === 0) return;

  await Promise.all(
    unactioned.map((d) =>
      notifyDriver(
        d.id,
        "That load has expired",
        "The load you were notified about got no match in time. Stay online — another one nearby may be coming your way.",
        { type: "SYSTEM", jobId },
      ),
    ),
  );
}
