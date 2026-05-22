import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { radiusExpansionQueue, notificationQueue } from "@/lib/queues";
import { getSocketServer } from "@/lib/socket";
import { getNearbyDrivers } from "./location.service";
import { getConfigNum } from "@/lib/app-config";

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

  await prisma.job.update({ where: { id: jobId }, data: { status: "POSTED" } });

  const { jobsNs } = getSocketServer();
  jobsNs.to(`job:${jobId}`).emit("job:expired", { jobId });

  await notificationQueue.add("notify", {
    type: "shipper",
    userId: job.shipperId,
    jobId,
    title: "No match found",
    body: "Your load didn't get matched. Repost to try again.",
  });
}
