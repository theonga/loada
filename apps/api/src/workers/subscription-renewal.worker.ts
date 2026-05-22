import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { renewSubscription } from "@/services/subscription.service";
import { notificationQueue } from "@/lib/queues";
import dayjs from "dayjs";

export async function processSubscriptionRenewal(_job: Job): Promise<void> {
  const expiringSoon = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      currentPeriodEnd: {
        gte: new Date(),
        lte: dayjs().add(24, "hour").toDate(),
      },
    },
    include: { driver: { include: { user: true } } },
  });

  for (const sub of expiringSoon) {
    await Promise.all([
      renewSubscription(sub.id),
      notificationQueue.add("notify", {
        type: "driver",
        userId: sub.driverId,
        title: "Subscription Expiring",
        body: "Your Loada subscription expires in 24 hours. Renew to keep access.",
      }),
    ]);
  }

  console.info(`[subscription-renewal] Processed ${expiringSoon.length} renewals`);
}
