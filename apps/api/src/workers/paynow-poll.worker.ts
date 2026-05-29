import type { Job } from "bullmq";
import { pollPayment } from "@/lib/paynow";
import { handlePaymentConfirmed } from "@/services/subscription.service";
import { confirmDeposit } from "@/services/wallet.service";
import { notificationQueue, paynowPollQueue } from "@/lib/queues";
import { getConfigNum } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

type SubscriptionPollData = {
  type?: "subscription";
  subscriptionId: string;
  pollUrl: string;
  attemptCount: number;
};

type WalletPollData = {
  type: "wallet";
  walletTransactionId: string;
  pollUrl: string;
  attemptCount: number;
};

type PollJobData = SubscriptionPollData | WalletPollData;

export async function processPaynowPoll(job: Job): Promise<void> {
  const data = job.data as PollJobData;

  const [pollIntervalSeconds, pollTimeoutSeconds] = await Promise.all([
    getConfigNum("paynow_poll_interval_seconds"),
    getConfigNum("paynow_poll_timeout_seconds"),
  ]);
  const maxAttempts = Math.ceil(pollTimeoutSeconds / pollIntervalSeconds);

  const result = await pollPayment(data.pollUrl);

  if (data.type === "wallet") {
    await handleWalletPoll(data, result, maxAttempts, pollIntervalSeconds);
  } else {
    await handleSubscriptionPoll(data as SubscriptionPollData, result, maxAttempts, pollIntervalSeconds);
  }
}

async function handleWalletPoll(
  data: WalletPollData,
  result: Awaited<ReturnType<typeof pollPayment>>,
  maxAttempts: number,
  pollIntervalSeconds: number,
): Promise<void> {
  if (result.status === "PAID") {
    await confirmDeposit(data.walletTransactionId);
    return;
  }

  if (result.status === "PENDING" && data.attemptCount < maxAttempts) {
    await paynowPollQueue.add(
      "poll",
      { ...data, attemptCount: data.attemptCount + 1 },
      { delay: pollIntervalSeconds * 1000 },
    );
    return;
  }

  // Timed out or failed — mark transaction and notify driver
  await prisma.walletTransaction.update({
    where: { id: data.walletTransactionId },
    data: { status: "FAILED" },
  });

  const tx = await prisma.walletTransaction.findUnique({
    where: { id: data.walletTransactionId },
    include: { wallet: true },
  });

  if (tx) {
    await notificationQueue.add("notify", {
      type: "driver",
      userId: tx.wallet.driverId,
      title: "Deposit Failed",
      body: "Your wallet deposit could not be confirmed. Please try again or contact support.",
    });
  }
}

async function handleSubscriptionPoll(
  data: SubscriptionPollData,
  result: Awaited<ReturnType<typeof pollPayment>>,
  maxAttempts: number,
  pollIntervalSeconds: number,
): Promise<void> {
  if (result.status === "PAID") {
    await handlePaymentConfirmed(data.subscriptionId, result.paynowRef ?? "unknown");
    return;
  }

  if (result.status === "PENDING" && data.attemptCount < maxAttempts) {
    await paynowPollQueue.add(
      "poll",
      { ...data, attemptCount: data.attemptCount + 1 },
      { delay: pollIntervalSeconds * 1000 },
    );
    return;
  }

  // Timed out or failed — log and notify driver
  const sub = await prisma.subscription.findUnique({
    where: { id: data.subscriptionId },
    include: { driver: { include: { user: true } } },
  });

  if (!sub) return;

  await prisma.subscriptionPayment.create({
    data: { subscriptionId: data.subscriptionId, amount: 0, currency: "USD", status: "FAILED" },
  });

  await notificationQueue.add("notify", {
    type: "driver",
    userId: sub.driverId,
    title: "Payment Failed",
    body: "Your subscription payment failed. Please try again in the app.",
  });
}
