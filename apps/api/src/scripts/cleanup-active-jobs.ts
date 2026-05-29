import { prisma } from '@/lib/prisma';

const ACTIVE = ['MATCHED', 'PICKUP_EN_ROUTE', 'PICKUP_ARRIVED', 'LOADED', 'IN_TRANSIT'];

async function main() {
  const jobs = await prisma.job.findMany({
    where: { status: { in: ACTIVE as never[] } },
    select: { id: true, status: true },
  });

  console.log(`Found ${jobs.length} active jobs:`, jobs.map((j) => `${j.id} (${j.status})`));

  if (jobs.length === 0) { console.log('Nothing to delete.'); return; }

  const ids = jobs.map((j) => j.id);

  await prisma.$transaction([
    prisma.rating.deleteMany({ where: { jobId: { in: ids } } }),
    prisma.message.deleteMany({ where: { jobId: { in: ids } } }),
    prisma.delivery.deleteMany({ where: { jobId: { in: ids } } }),
    prisma.bid.deleteMany({ where: { jobId: { in: ids } } }),
    prisma.job.deleteMany({ where: { id: { in: ids } } }),
  ]);

  console.log(`Deleted ${ids.length} active jobs and all related records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
