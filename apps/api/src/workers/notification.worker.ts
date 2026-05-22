import type { Job } from "bullmq";
import { notifyDriver, notifyShipper, notifyNearbyDrivers } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";

interface NotificationJobData {
  type: "driver" | "shipper" | "nearby_drivers";
  userId?: string;
  jobId?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function processNotification(job: Job): Promise<void> {
  const payload = job.data as NotificationJobData;

  if (payload.type === "nearby_drivers" && payload.jobId) {
    const dbJob = await prisma.job.findUnique({ where: { id: payload.jobId } });
    if (dbJob) await notifyNearbyDrivers(dbJob);
    return;
  }

  if (!payload.userId) return;

  if (payload.type === "driver") {
    await notifyDriver(payload.userId, payload.title, payload.body, payload.data);
  } else if (payload.type === "shipper") {
    await notifyShipper(payload.userId, payload.title, payload.body, payload.data);
  }
}
