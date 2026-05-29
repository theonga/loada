import type { Job } from "bullmq";
import { pollPayment } from "@/lib/paynow";
import { confirmDeposit } from "@/services/wallet.service";
import { notificationQueue, paynowPollQueue } from "@/lib/queues";
import { getConfigNum } from "@/lib/app-config";
import { prisma } from "@/lib/prisma";

type WalletPollData = {
  type: "wallet";
  walletTransactionId: string;
  pollUrl: string;
  attemptCount: number;
};

export async function processPaynowPoll(job: Job): Promise<void> {
  const data = job.data as WalletPollData;

  const [pollIntervalSeconds, pollTimeoutSeconds] = await Promise.all([
    getConfigNum("paynow_poll_interval_seconds"),
    getConfigNum("paynow_poll_timeout_seconds"),
  ]);
  const maxAttempts = Math.ceil(pollTimeoutSeconds / pollIntervalSeconds);

  const result = await pollPayment(data.pollUrl);

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
      targetId: tx.wallet.driverId,
      title: "Deposit Failed",
      body: "Your wallet deposit could not be confirmed. Please try again or contact support.",
    });
  }
}
