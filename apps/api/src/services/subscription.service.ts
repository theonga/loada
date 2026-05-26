import { prisma } from "@/lib/prisma";
import { initiatePayment } from "@/lib/paynow";
import { paynowPollQueue } from "@/lib/queues";
import { notifyDriver } from "./notification.service";
import { smsSubscriptionActive, smsSubscriptionExpired } from "@/lib/bulkit";
import { getConfigNum } from "@/lib/app-config";
import type { SubscriptionPlan } from "@prisma/client";
import type { PaynowMethod } from "@/lib/paynow";
import dayjs from "dayjs";

const PLAN_DAYS: Record<SubscriptionPlan, number> = {
  WEEKLY: 7,
  MONTHLY: 30,
  ANNUAL: 365,
};

async function planAmount(plan: SubscriptionPlan): Promise<number> {
  const map: Record<SubscriptionPlan, () => Promise<number>> = {
    WEEKLY:  () => getConfigNum("subscription_price_weekly"),
    MONTHLY: () => getConfigNum("subscription_price_monthly"),
    ANNUAL:  () => getConfigNum("subscription_price_annual"),
  };
  return map[plan]();
}

export async function createSubscription(
  driverId: string,
  plan: SubscriptionPlan,
  method: PaynowMethod,
  phone?: string,
  email?: string,
): Promise<{ subscription: object; pollUrl: string; redirectUrl: string }> {
  const amount = await planAmount(plan);
  const reference = `loada-sub-${driverId}-${Date.now()}`;

  let pollUrl = "stub://paynow";
  let redirectUrl = "";

  try {
    const payment = await initiatePayment({
      reference,
      amount,
      method,
      phone: phone ?? "",
      email: email ?? "",
      description: `Loada ${plan} subscription`,
    });
    pollUrl = payment.pollUrl;
    redirectUrl = payment.redirectUrl;
  } catch (err) {
    console.error("[Paynow] initiate failed:", err);
  }

  const periodEnd = dayjs().add(PLAN_DAYS[plan], "day").toDate();

  const subscription = await prisma.subscription.upsert({
    where: { driverId },
    create: {
      driverId,
      plan,
      status: "TRIAL",
      currentPeriodEnd: periodEnd,
      paynowReference: reference,
      payments: {
        create: { amount, currency: "USD", status: "PENDING" },
      },
    },
    update: {
      plan,
      status: "TRIAL",
      currentPeriodEnd: periodEnd,
      paynowReference: reference,
    },
  });

  await paynowPollQueue.add("poll", { subscriptionId: subscription.id, pollUrl, attemptCount: 0 });

  return { subscription, pollUrl, redirectUrl };
}

export async function handlePaymentConfirmed(subscriptionId: string, paynowRef: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { driver: { include: { user: true } } },
  });
  if (!sub) return;

  const amount = await planAmount(sub.plan);
  const periodEnd = dayjs().add(PLAN_DAYS[sub.plan], "day").toDate();

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "ACTIVE", currentPeriodEnd: periodEnd, paynowReference: paynowRef },
    }),
    prisma.subscriptionPayment.create({
      data: { subscriptionId, amount, currency: "USD", paynowRef, status: "PAID", paidAt: new Date() },
    }),
  ]);

  await notifyDriver(
    sub.driverId,
    "Subscription Activated",
    `Your ${sub.plan} Loada subscription is now active. Start browsing loads.`,
  );
  await smsSubscriptionActive(sub.driver.user.phone, sub.plan);
}

export async function renewSubscription(subscriptionId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { driver: { include: { user: true } } },
  });
  if (!sub || sub.status !== "ACTIVE") return;

  const amount = await planAmount(sub.plan);
  const reference = `loada-renew-${subscriptionId}-${Date.now()}`;

  try {
    const payment = await initiatePayment({
      reference,
      amount,
      method: "ecocash",
      phone: sub.driver.user.phone,
      description: `Loada ${sub.plan} renewal`,
    });

    await paynowPollQueue.add("poll", { subscriptionId, pollUrl: payment.pollUrl, attemptCount: 0 });
  } catch (err) {
    console.error("[Subscription] Renewal payment initiation failed:", err);
    await prisma.subscriptionPayment.create({
      data: { subscriptionId, amount, currency: "USD", status: "FAILED" },
    });
  }
}

export async function suspendExpiredDrivers(): Promise<void> {
  const expired = await prisma.subscription.findMany({
    where: { currentPeriodEnd: { lt: new Date() }, status: "ACTIVE" },
    include: { driver: { include: { user: true } } },
  });

  for (const sub of expired) {
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } });
    await notifyDriver(sub.driverId, "Subscription Expired", "Your subscription has expired. Renew to access loads.");
    await smsSubscriptionExpired(sub.driver.user.phone);
  }
}
