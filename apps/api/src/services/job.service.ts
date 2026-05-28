import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { bidExpiryQueue, radiusExpansionQueue, notificationQueue } from "@/lib/queues";
import { getSocketServer } from "@/lib/socket";
import { getConfigNum } from "@/lib/app-config";
import type { JobStatus } from "@prisma/client";

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
  MATCHED: ["PICKUP_EN_ROUTE", "CANCELLED"],
  PICKUP_EN_ROUTE: ["PICKUP_ARRIVED"],
  PICKUP_ARRIVED: ["LOADED"],
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
    include: { subscription: true },
  });
  if (!driver) throw Object.assign(new Error("Driver not found"), { statusCode: 404, code: "DRIVER_NOT_FOUND" });

  const jobs = await prisma.$queryRaw<
    Array<{
      id: string;
      originAddress: string;
      destAddress: string;
      requiredTonnes: number;
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

export async function cancelJob(jobId: string, userId: string) {
  const job = await prisma.job.findUnique({ where: { id: jobId }, include: { shipper: true } });
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  if (job.shipper.userId !== userId) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, code: "FORBIDDEN" });
  }
  if (["COMPLETED", "CANCELLED"].includes(job.status)) {
    throw Object.assign(new Error("Cannot cancel a completed or already cancelled job"), {
      statusCode: 400,
      code: "INVALID_STATUS",
    });
  }

  await prisma.job.update({ where: { id: jobId }, data: { status: "CANCELLED" } });
  await redis.del(`loada:job:${jobId}:status`);
}

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
