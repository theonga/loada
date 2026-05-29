import type { Job } from "bullmq";
import { notifyDriver, notifyShipper, notifyNearbyDrivers } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";

/**
 * BullMQ payload for the `notification` queue.
 *
 * `targetId` is the recipient's *profile* ID — `DriverProfile.id` when `type` is
 * `"driver"`, `ShipperProfile.id` when `type` is `"shipper"`. It is NOT
 * `User.id`. The notification service then writes a `Notification` row keyed by
 * `User.id` (resolved from the profile), so the DB row is always accurate.
 *
 * For `"nearby_drivers"`, no targetId is needed — the service finds drivers
 * within radius of `jobId` itself.
 */
export type NotificationJobData =
  | { type: "driver"; targetId: string; jobId?: string; title: string; body: string; data?: Record<string, string> }
  | { type: "shipper"; targetId: string; jobId?: string; title: string; body: string; data?: Record<string, string> }
  | { type: "nearby_drivers"; jobId: string; title: string; body: string; data?: Record<string, string> };

export async function processNotification(job: Job): Promise<void> {
  const payload = job.data as NotificationJobData;

  if (payload.type === "nearby_drivers") {
    const dbJob = await prisma.job.findUnique({ where: { id: payload.jobId } });
    if (dbJob) await notifyNearbyDrivers(dbJob);
    return;
  }

  if (payload.type === "driver") {
    await notifyDriver(payload.targetId, payload.title, payload.body, payload.data);
  } else if (payload.type === "shipper") {
    await notifyShipper(payload.targetId, payload.title, payload.body, payload.data);
  }
}
