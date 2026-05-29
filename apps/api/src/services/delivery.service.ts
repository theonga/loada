import { prisma } from "@/lib/prisma";
import { resolveStoredFile } from "@/lib/s3";
import { notifyShipper, notifyDriver } from "./notification.service";
import { transitionJobStatus } from "./job.service";
import { deductCommission } from "./wallet.service";
import { getConfigNum } from "@/lib/app-config";

/**
 * Server-side proximity gate for trip transitions.
 *
 * Returns the distance in km between the driver's last known location and the
 * waypoint. Throws GPS_TOO_FAR if outside the configured tolerance. We pull
 * the driver's location from DriverProfile (updated by the live location
 * heartbeat) rather than trusting client-supplied coordinates — a malicious
 * client could otherwise spoof any lat/lng in the request body.
 */
async function assertNearWaypoint(
  driverId: string,
  waypointLat: number,
  waypointLng: number,
  label: "pickup" | "delivery",
): Promise<void> {
  const driver = await prisma.driverProfile.findUnique({
    where: { id: driverId },
    select: { lastLocationLat: true, lastLocationLng: true, lastLocationAt: true },
  });

  // If we have no recent location we *intentionally* don't fall through —
  // a missing/stale fix is itself a red flag. Block the transition and tell
  // the driver to make sure GPS is on. Threshold: 30 minutes.
  const fix = driver?.lastLocationLat != null && driver?.lastLocationLng != null ? driver : null;
  const stale = fix?.lastLocationAt
    ? Date.now() - fix.lastLocationAt.getTime() > 30 * 60 * 1000
    : true;

  if (!fix || stale) {
    throw Object.assign(
      new Error(`Couldn't verify your location at ${label}. Turn on GPS in the app and try again.`),
      { statusCode: 400, code: "GPS_UNAVAILABLE" },
    );
  }

  const tolerance = await getConfigNum("delivery_gps_tolerance_km");
  const distance = haversineKm(fix.lastLocationLat!, fix.lastLocationLng!, waypointLat, waypointLng);
  if (distance > tolerance) {
    throw Object.assign(
      new Error(
        `You're ${distance.toFixed(1)} km from the ${label} location. Get within ${tolerance} km to confirm.`,
      ),
      { statusCode: 400, code: "GPS_TOO_FAR", distanceKm: distance, toleranceKm: tolerance },
    );
  }
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

  // Prove the driver is actually at the pickup point before we let them flip
  // the status — closes the "tap through every screen from your couch" hole.
  await assertNearWaypoint(driverId, job.originLat, job.originLng, "pickup");

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

  // Same proximity gate as pickup — driver has to actually be near the
  // destination to settle the trip and trigger commission deduction.
  await assertNearWaypoint(driverId, job.destLat, job.destLng, "delivery");

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
    select: { id: true, commissionAmount: true, offeredPrice: true },
  });
  if (acceptedBid) {
    // Fallback path: if the bid has no recorded commissionAmount (legacy bid,
    // future admin-injected bid, migration glitch), recompute it from the
    // accepted price × current commission % rather than silently skipping the
    // deduction — that was a hole big enough to leak revenue indefinitely.
    let commission: number;
    if (acceptedBid.commissionAmount) {
      commission = parseFloat(acceptedBid.commissionAmount.toString());
    } else {
      const pct = await getConfigNum("loada_commission_pct");
      commission = parseFloat((parseFloat(acceptedBid.offeredPrice.toString()) * pct / 100).toFixed(2));
      console.warn("[confirmDelivery] bid missing commissionAmount — using fallback", { jobId, bidId: acceptedBid.id, commission });
    }

    try {
      await deductCommission(driverId, acceptedBid.id, jobId, commission);
      // Tell the driver their net earnings landed; suppress on failure so the
      // delivery itself still goes through.
      notifyDriver(
        driverId,
        "Job complete",
        `$${commission.toFixed(2)} platform fee deducted. Great work.`,
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
