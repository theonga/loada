import { prisma } from "@/lib/prisma";
import { transitionJobStatus } from "./job.service";

export async function submitRating(
  jobId: string,
  fromUserId: string,
  toUserId: string,
  score: number,
  tags: string[],
  comment?: string,
): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      shipper: true,
      bids: { where: { status: "ACCEPTED" }, include: { driver: true } },
    },
  });

  if (!job) throw Object.assign(new Error("Job not found"), { statusCode: 404, code: "JOB_NOT_FOUND" });
  if (!["DELIVERED", "COMPLETED"].includes(job.status)) {
    throw Object.assign(new Error("Job must be delivered before rating"), {
      statusCode: 400,
      code: "INVALID_STATUS",
    });
  }

  const shipperUserId = job.shipper.userId;
  const acceptedBid = job.bids[0];
  const driverUserId = acceptedBid?.driver.userId;

  const isParty = fromUserId === shipperUserId || fromUserId === driverUserId;
  if (!isParty) {
    throw Object.assign(new Error("You were not a party to this job"), { statusCode: 403, code: "FORBIDDEN" });
  }

  const existing = await prisma.rating.findFirst({ where: { jobId, fromUserId } });
  if (existing) {
    throw Object.assign(new Error("You have already rated this job"), { statusCode: 400, code: "ALREADY_RATED" });
  }

  await prisma.rating.create({
    data: { jobId, fromUserId, toUserId, score, tags, comment },
  });

  const allRatings = await prisma.rating.findMany({ where: { jobId } });
  if (allRatings.length >= 2 && job.status === "DELIVERED") {
    await transitionJobStatus(jobId, "COMPLETED");
  }
}

export async function getUserAggregateRating(userId: string): Promise<{ average: number; count: number }> {
  const ratings = await prisma.rating.findMany({ where: { toUserId: userId } });
  if (!ratings.length) return { average: 0, count: 0 };
  const average = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
  return { average: Math.round(average * 10) / 10, count: ratings.length };
}
