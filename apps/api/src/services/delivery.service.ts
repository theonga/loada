import { prisma } from "@/lib/prisma";
import { getDownloadPresignedUrl } from "@/lib/s3";
import { notifyShipper } from "./notification.service";
import { transitionJobStatus } from "./job.service";

export async function confirmPickup(
  jobId: string,
  driverId: string,
  photoUri: string,
  discrepancyNote?: string,
): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { shipper: { include: { user: true } } },
  });
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  if (job.status !== "PICKUP_ARRIVED") {
    throw Object.assign(new Error("Job must be in PICKUP_ARRIVED status"), {
      statusCode: 400,
      code: "INVALID_STATUS",
    });
  }
  if (job.matchedDriverId !== driverId) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, code: "FORBIDDEN" });
  }
  void discrepancyNote;

  await prisma.delivery.upsert({
    where: { jobId },
    create: { jobId, pickupConfirmedAt: new Date(), pickupPhotoUrl: photoUri },
    update: { pickupConfirmedAt: new Date(), pickupPhotoUrl: photoUri },
  });

  await transitionJobStatus(jobId, "LOADED");

  await notifyShipper(
    job.shipperId,
    "Cargo Loaded",
    `Your cargo is loaded. The driver is heading to ${job.destAddress}.`,
    { jobId },
  );
}

export async function confirmDelivery(
  jobId: string,
  driverId: string,
  photoUri: string,
  recipientName: string,
  signatureUri?: string,
  lat?: number,
  lng?: number,
): Promise<void> {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  if (job.status !== "IN_TRANSIT") {
    throw Object.assign(new Error("Job must be IN_TRANSIT to confirm delivery"), {
      statusCode: 400,
      code: "INVALID_STATUS",
    });
  }
  if (job.matchedDriverId !== driverId) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403, code: "FORBIDDEN" });
  }

  await prisma.delivery.upsert({
    where: { jobId },
    create: {
      jobId,
      deliveredAt: new Date(),
      deliveryPhotoUrl: photoUri,
      recipientName,
      signatureUrl: signatureUri,
      deliveryLat: lat,
      deliveryLng: lng,
    },
    update: {
      deliveredAt: new Date(),
      deliveryPhotoUrl: photoUri,
      recipientName,
      signatureUrl: signatureUri,
      deliveryLat: lat,
      deliveryLng: lng,
    },
  });

  await transitionJobStatus(jobId, "DELIVERED");

  await notifyShipper(
    job.shipperId,
    "Delivered",
    "Your load has been delivered. Download your proof of delivery.",
    { jobId },
  );
}

export async function getPOD(jobId: string) {
  const delivery = await prisma.delivery.findUnique({ where: { jobId } });
  if (!delivery) throw Object.assign(new Error("No delivery record found"), { statusCode: 404, code: "NOT_FOUND" });

  const [pickupPhotoUrl, deliveryPhotoUrl, signatureUrl] = await Promise.all([
    delivery.pickupPhotoUrl ? getDownloadPresignedUrl(delivery.pickupPhotoUrl) : null,
    delivery.deliveryPhotoUrl ? getDownloadPresignedUrl(delivery.deliveryPhotoUrl) : null,
    delivery.signatureUrl ? getDownloadPresignedUrl(delivery.signatureUrl) : null,
  ]);

  return {
    ...delivery,
    pickupPhotoUrl,
    deliveryPhotoUrl,
    signatureUrl,
  };
}
