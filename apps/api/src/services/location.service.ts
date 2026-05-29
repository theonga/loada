import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getSocketServer } from "@/lib/socket";
import { getDirections } from "@/lib/google-maps";
import type { DriverProfile } from "@prisma/client";

const LOCATION_DB_DEBOUNCE_SECONDS = 30;

export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number,
): Promise<void> {
  await redis.geoadd("loada:drivers:online", lng, lat, driverId);

  const locationData = JSON.stringify({ lat, lng, heading, speed, updatedAt: Date.now() });
  await redis.setex(`loada:driver:${driverId}:location`, 30, locationData);

  const debounceKey = `loada:driver:${driverId}:db_update`;
  const lastUpdate = await redis.get(debounceKey);
  if (!lastUpdate) {
    await Promise.all([
      prisma.driverProfile.update({
        where: { id: driverId },
        data: { lastLocationLat: lat, lastLocationLng: lng, lastLocationAt: new Date() },
      }),
      redis.setex(debounceKey, LOCATION_DB_DEBOUNCE_SECONDS, "1"),
    ]);
  }

  // Emit to shipper's tracking room if driver has an active job
  const activeJob = await prisma.job.findFirst({
    where: {
      matchedDriverId: driverId,
      status: { in: ["MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT"] },
    },
  });

  if (activeJob) {
    let etaSeconds: number | undefined;
    try {
      const dest = activeJob.status === "IN_TRANSIT"
        ? { lat: activeJob.destLat, lng: activeJob.destLng }
        : { lat: activeJob.originLat, lng: activeJob.originLng };
      const directions = await getDirections({ lat, lng }, dest);
      etaSeconds = directions.durationS;
    } catch {
      // ETA calc failure is non-fatal
    }

    const { locationNs } = getSocketServer();
    locationNs.to(`job:${activeJob.id}`).emit("location:driver", {
      lat,
      lng,
      heading,
      speed,
      etaSeconds,
    });
  }
}

export async function getNearbyDrivers(
  lat: number,
  lng: number,
  radiusKm: number,
  requiredTonnes: number,
  requiredTruckType?: string,
): Promise<DriverProfile[]> {
  const driverIds = await redis.georadius(
    "loada:drivers:online",
    lng,
    lat,
    radiusKm,
    "km",
    "ASC",
  ) as string[];

  if (!driverIds.length) return [];

  const drivers = await prisma.driverProfile.findMany({
    where: {
      id: { in: driverIds },
      capacityTonnes: { gte: requiredTonnes },
      ...(requiredTruckType ? { truckType: requiredTruckType as import("@prisma/client").TruckType } : {}),
      documentStatus: "APPROVED",
    },
    include: { user: true },
  });

  return drivers;
}

export async function setDriverOnline(driverId: string, lat: number, lng: number): Promise<void> {
  await Promise.all([
    redis.geoadd("loada:drivers:online", lng, lat, driverId),
    prisma.driverProfile.update({ where: { id: driverId }, data: { isOnline: true } }),
  ]);
}

export async function setDriverOffline(driverId: string): Promise<void> {
  await Promise.all([
    redis.zrem("loada:drivers:online", driverId),
    prisma.driverProfile.update({ where: { id: driverId }, data: { isOnline: false } }),
  ]);
}
