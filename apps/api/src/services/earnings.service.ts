import { prisma } from "@/lib/prisma";
import { getConfigNum } from "@/lib/app-config";
import dayjs from "dayjs";

export interface DayEarnings {
  date: string;
  dayOfWeek: string;
  earned: number;
  jobs: number;
}

export interface EarningsSummary {
  totalEarned: number;
  jobsCompleted: number;
  averagePerJob: number;
  bestDay: DayEarnings | null;
  byDay: DayEarnings[];
  subscriptionCost: number;
  trendPercent: number | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getEarningsSummary(
  driverId: string,
  from: Date,
  to: Date,
): Promise<EarningsSummary> {
  const [jobs, subscription] = await Promise.all([
    prisma.job.findMany({
      where: {
        matchedDriverId: driverId,
        status: { in: ["DELIVERED", "COMPLETED"] },
        createdAt: { gte: from, lte: to },
      },
      include: {
        bids: { where: { status: "ACCEPTED" } },
      },
    }),
    prisma.subscription.findUnique({ where: { driverId } }),
  ]);

  const dayMap = new Map<string, DayEarnings>();

  let totalEarned = 0;

  for (const job of jobs) {
    const acceptedBid = job.bids[0];
    const amount = acceptedBid ? parseFloat(acceptedBid.offeredPrice.toString()) : 0;
    const dateStr = dayjs(job.createdAt).format("YYYY-MM-DD");
    const dayOfWeek = DAYS[dayjs(job.createdAt).day()];

    const existing = dayMap.get(dateStr);
    if (existing) {
      existing.earned += amount;
      existing.jobs += 1;
    } else {
      dayMap.set(dateStr, { date: dateStr, dayOfWeek, earned: amount, jobs: 1 });
    }
    totalEarned += amount;
  }

  const byDay = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const bestDay = byDay.reduce<DayEarnings | null>((best, d) => (!best || d.earned > best.earned ? d : best), null);

  const rangeMs = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - rangeMs);
  const prevTo = new Date(from.getTime() - 1);

  const prevJobs = await prisma.job.findMany({
    where: {
      matchedDriverId: driverId,
      status: { in: ["DELIVERED", "COMPLETED"] },
      createdAt: { gte: prevFrom, lte: prevTo },
    },
    include: { bids: { where: { status: "ACCEPTED" } } },
  });

  const prevTotal = prevJobs.reduce((sum, j) => {
    const bid = j.bids[0];
    return sum + (bid ? parseFloat(bid.offeredPrice.toString()) : 0);
  }, 0);

  let trendPercent: number | null = null;
  if (prevTotal > 0) {
    trendPercent = Math.round(((totalEarned - prevTotal) / prevTotal) * 100);
  }

  const subscriptionCost = subscription ? await getSubscriptionCostForPeriod(subscription.plan, from, to) : 0;

  return {
    totalEarned,
    jobsCompleted: jobs.length,
    averagePerJob: jobs.length > 0 ? Math.round((totalEarned / jobs.length) * 100) / 100 : 0,
    bestDay,
    byDay,
    subscriptionCost,
    trendPercent,
  };
}

async function getSubscriptionCostForPeriod(
  plan: string,
  from: Date,
  to: Date,
): Promise<number> {
  const days = dayjs(to).diff(dayjs(from), "day") + 1;
  const [weekly, monthly, annual] = await Promise.all([
    getConfigNum("subscription_price_weekly"),
    getConfigNum("subscription_price_monthly"),
    getConfigNum("subscription_price_annual"),
  ]);
  const costs: Record<string, number> = {
    WEEKLY: weekly / 7,
    MONTHLY: monthly / 30,
    ANNUAL: annual / 365,
  };
  const daily = costs[plan] ?? 0;
  return Math.round(daily * days * 100) / 100;
}
