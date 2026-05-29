import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

export interface DayEarnings {
  date: string;
  dayOfWeek: string;
  earned: number;
  commissionPaid: number;
  jobs: number;
}

export interface EarningsSummary {
  totalEarned: number;
  totalCommissionPaid: number;
  netEarned: number;
  jobsCompleted: number;
  averagePerJob: number;
  bestDay: DayEarnings | null;
  byDay: DayEarnings[];
  subscriptionCost: number;
  trendPercent: number | null;
  walletBalance: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getEarningsSummary(
  driverId: string,
  from: Date,
  to: Date,
): Promise<EarningsSummary> {
  const [jobs, wallet] = await Promise.all([
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
    prisma.driverWallet.findUnique({ where: { driverId } }),
  ]);

  const dayMap = new Map<string, DayEarnings>();

  let totalEarned = 0;
  let totalCommissionPaid = 0;

  for (const job of jobs) {
    const acceptedBid = job.bids[0];
    const amount = acceptedBid ? parseFloat(acceptedBid.offeredPrice.toString()) : 0;
    const commission = acceptedBid?.commissionAmount
      ? parseFloat(acceptedBid.commissionAmount.toString())
      : 0;
    const dateStr = dayjs(job.createdAt).format("YYYY-MM-DD");
    const dayOfWeek = DAYS[dayjs(job.createdAt).day()];

    const existing = dayMap.get(dateStr);
    if (existing) {
      existing.earned += amount;
      existing.commissionPaid += commission;
      existing.jobs += 1;
    } else {
      dayMap.set(dateStr, { date: dateStr, dayOfWeek, earned: amount, commissionPaid: commission, jobs: 1 });
    }
    totalEarned += amount;
    totalCommissionPaid += commission;
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

  return {
    totalEarned,
    totalCommissionPaid,
    netEarned: Math.round((totalEarned - totalCommissionPaid) * 100) / 100,
    jobsCompleted: jobs.length,
    averagePerJob: jobs.length > 0 ? Math.round((totalEarned / jobs.length) * 100) / 100 : 0,
    bestDay,
    byDay,
    subscriptionCost: 0,
    trendPercent,
    walletBalance: wallet ? parseFloat(wallet.balance.toString()) : 0,
  };
}
