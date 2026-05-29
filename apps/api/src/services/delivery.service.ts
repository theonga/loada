import { prisma } from "@/lib/prisma";
import { resolveStoredFile } from "@/lib/s3";
import { notifyShipper, notifyDriver } from "./notification.service";
import { transitionJobStatus } from "./job.service";
import { deductCommission } from "./wallet.service";

export async function confirmPickup(
  jobId: string,
  driverId: string,
  photoUri?: string,
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

  const driverUser = await prisma.driverProfile.findUnique({
    where: { id: driverId },
    select: { user: { select: { name: true } } },
  });
  const driverName = driverUser?.user?.name ?? "Your driver";

  await prisma.delivery.upsert({
    where: { jobId },
    create: { jobId, pickupConfirmedAt: new Date(), pickupPhotoUrl: photoUri ?? null },
    update: { pickupConfirmedAt: new Date(), ...(photoUri ? { pickupPhotoUrl: photoUri } : {}) },
  });

  // Skip the transient LOADED state — driver confirming pickup means the cargo
  // is loaded and they are starting the delivery leg. Going straight to
  // IN_TRANSIT means the delivery confirmation screen can move IN_TRANSIT → DELIVERED
  // without needing a separate intermediate transition.
  await transitionJobStatus(jobId, "IN_TRANSIT");

  await notifyShipper(
    job.shipperId,
    "Cargo Loaded",
    `${driverName} has loaded your cargo and is heading to ${job.destAddress}.`,
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

  const driverUser = await prisma.driverProfile.findUnique({
    where: { id: driverId },
    select: { user: { select: { name: true } } },
  });
  const driverName = driverUser?.user?.name ?? "Your driver";

  await transitionJobStatus(jobId, "DELIVERED");

  // Settle the Loada commission now that the driver has completed the job.
  // The commission was reserved at bid time (reserveCommission) and moves from
  // reservedBalance → Loada revenue here. We do this BEFORE notifying the
  // shipper so a settlement failure surfaces as a 500 the driver can retry.
  const acceptedBid = await prisma.bid.findFirst({
    where: { jobId, status: "ACCEPTED" },
    select: { id: true, commissionAmount: true },
  });
  if (acceptedBid?.commissionAmount) {
    const commission = parseFloat(acceptedBid.commissionAmount.toString());
    try {
      await deductCommission(driverId, acceptedBid.id, jobId, commission);
      // Tell the driver their net earnings landed; suppress on failure so the
      // delivery itself still goes through.
      notifyDriver(
        driverId,
        "Job complete",
        `$${(parseFloat((acceptedBid.commissionAmount).toString())).toFixed(2)} platform fee deducted. Great work.`,
        { jobId, screen: "earnings" },
      ).catch(() => {});
    } catch (err) {
      // Don't roll back the delivery for a commission settlement failure —
      // the audit log + alarms catch it. The reserved balance stays put so
      // it can be retried via a maintenance script.
      console.error("[confirmDelivery] commission settlement failed", { jobId, bidId: acceptedBid.id, err });
    }
  }

  await notifyShipper(
    job.shipperId,
    "Delivered",
    `${driverName} has delivered your load. Download your proof of delivery.`,
    { jobId },
  );
}

export async function getPOD(jobId: string) {
  const delivery = await prisma.delivery.findUnique({ where: { jobId } });
  if (!delivery) throw Object.assign(new Error("No delivery record found"), { statusCode: 404, code: "NOT_FOUND" });

  const [pickupPhotoUrl, deliveryPhotoUrl, signatureUrl] = await Promise.all([
    resolveStoredFile(delivery.pickupPhotoUrl),
    resolveStoredFile(delivery.deliveryPhotoUrl),
    resolveStoredFile(delivery.signatureUrl),
  ]);

  return {
    ...delivery,
    pickupPhotoUrl,
    deliveryPhotoUrl,
    signatureUrl,
  };
}
