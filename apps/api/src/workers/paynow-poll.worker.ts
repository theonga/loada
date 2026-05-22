import type { Job } from "bullmq";
import { pollPayment } from "@/lib/paynow";
import { handlePaymentConfirmed } from "@/services/subscription.service";
import { notificationQueue, paynowPollQueue } from "@/lib/queues";
import { getConfigNum } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

interface PollJobData {
  subscriptionId: string;
  pollUrl: string;
  attemptCount: number;
}

export async function processPaynowPoll(job: Job): Promise<void> {
  const { subscriptionId, pollUrl, attemptCount } = job.data as PollJobData;

  const result = await pollPayment(pollUrl);

  if (result.status === "PAID") {
    await handlePaymentConfirmed(subscriptionId, result.paynowRef ?? "unknown");
    return;
  }

  const [pollIntervalSeconds, pollTimeoutSeconds] = await Promise.all([
    getConfigNum("paynow_poll_interval_seconds"),
    getConfigNum("paynow_poll_timeout_seconds"),
  ]);
  const maxAttempts = Math.ceil(pollTimeoutSeconds / pollIntervalSeconds);

  if (result.status === "PENDING" && attemptCount < maxAttempts) {
    await paynowPollQueue.add(
      "poll",
      { subscriptionId, pollUrl, attemptCount: attemptCount + 1 },
      { delay: pollIntervalSeconds * 1000 },
    );
    return;
  }

  // FAILED, CANCELLED, or max attempts reached
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { driver: { include: { user: true } } },
  });

  if (!sub) return;

  await prisma.subscriptionPayment.create({
    data: { subscriptionId, amount: 0, currency: "USD", status: "FAILED" },
  });

  await notificationQueue.add("notify", {
    type: "driver",
    userId: sub.driverId,
    title: "Payment Failed",
    body: "Your subscription payment failed. Please try again in the app.",
  });
}
