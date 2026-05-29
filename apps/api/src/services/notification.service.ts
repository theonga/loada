import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/fcm";
import { sendSMS } from "@/lib/bulkit";
import { getNearbyDrivers } from "./location.service";
import type { Job } from "@prisma/client";

async function pushOrSms(
  userId: string,
  fcmToken: string | null,
  phone: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (fcmToken) {
    const result = await sendPushNotification(fcmToken, title, body, data);
    if (result.invalidToken) {
      // Stale token — clear it so future notifications fall straight to SMS
      await prisma.user.update({ where: { id: userId }, data: { fcmToken: null } });
    }
    if (result.sent) return;
    // FCM failed (network, quota, invalid token) — cascade to SMS
  }
  await sendSMS(phone, `${title}: ${body}`);
}

export async function notifyDriver(
  driverId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const driver = await prisma.driverProfile.findUnique({
    where: { id: driverId },
    include: { user: true },
  });
  if (!driver) return;

  await prisma.notification.create({
    data: {
      userId: driver.userId,
      type:   data?.type ?? "SYSTEM",
      title,
      body,
      jobId:  data?.jobId ?? null,
      data:   data ?? undefined,
    },
  });

  await pushOrSms(driver.userId, driver.user.fcmToken ?? null, driver.user.phone, title, body, data);
}

export async function notifyShipper(
  shipperId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const shipper = await prisma.shipperProfile.findUnique({
    where: { id: shipperId },
    include: { user: true },
  });
  if (!shipper) return;

  await prisma.notification.create({
    data: {
      userId: shipper.userId,
      type:   data?.type ?? "SYSTEM",
      title,
      body,
      jobId:  data?.jobId ?? null,
      data:   data ?? undefined,
    },
  });

  await pushOrSms(shipper.userId, shipper.user.fcmToken ?? null, shipper.user.phone, title, body, data);
}

export async function notifyNearbyDrivers(job: Job): Promise<void> {
  if (!job.originLat || !job.originLng) return;

  const drivers = await getNearbyDrivers(
    job.originLat,
    job.originLng,
    job.searchRadiusKm,
    job.requiredTonnes,
    job.requiredTruckType ?? undefined,
  );

  // Emit via Socket.IO first — instant delivery for drivers with the app open
  try {
    const { jobsNs } = (await import("@/lib/socket")).getSocketServer();
    drivers.forEach((driver) => {
      jobsNs.to(`driver:${driver.id}`).emit("job:new_load", {
        jobId: job.id,
        type: "new_load",
      });
    });
  } catch {
    // Socket server not yet initialised — FCM/SMS will cover it
  }

  // FCM/SMS in parallel for background/offline drivers
  await Promise.all(
    drivers.map((driver) =>
      notifyDriver(
        driver.id,
        "New Load Available",
        `${job.requiredTonnes}t load from ${job.originAddress.split(",")[0]} → ${job.destAddress.split(",")[0]}. Tap to bid.`,
        { type: "new_load", jobId: job.id },
      ),
    ),
  );
}
