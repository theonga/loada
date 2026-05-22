import { prisma } from "@/lib/prisma";
import { sendPushNotification } from "@/lib/fcm";
import { sendSMS } from "@/lib/bulkit";
import { getNearbyDrivers } from "./location.service";
import type { Job } from "@prisma/client";

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

  if (driver.user.fcmToken) {
    await sendPushNotification(driver.user.fcmToken, title, body, data);
  } else {
    await sendSMS(driver.user.phone, `${title}: ${body}`);
  }
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

  if (shipper.user.fcmToken) {
    await sendPushNotification(shipper.user.fcmToken, title, body, data);
  } else {
    await sendSMS(shipper.user.phone, `${title}: ${body}`);
  }
}

export async function notifyNearbyDrivers(job: Job): Promise<void> {
  if (!job.originLat || !job.originLng) return;

  const drivers = await getNearbyDrivers(
    job.originLat,
    job.originLng,
    job.searchRadiusKm,
    job.requiredTonnes,
  );

  await Promise.all(
    drivers.map((driver) =>
      notifyDriver(
        driver.id,
        "New Load Available",
        `New bid: a ${job.requiredTonnes}t load from ${job.originAddress} to ${job.destAddress}.`,
        { jobId: job.id },
      ),
    ),
  );
}
