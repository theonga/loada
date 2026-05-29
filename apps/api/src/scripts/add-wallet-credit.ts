import { prisma } from '@/lib/prisma';

const PHONE = process.argv[2];
const AMOUNT = parseFloat(process.argv[3] ?? '0');

async function main() {
  if (!PHONE || isNaN(AMOUNT) || AMOUNT <= 0) {
    console.error('Usage: add-wallet-credit.ts <phone> <amount>');
    process.exit(1);
  }

  // Try both local and E.164 format
  const user = await prisma.user.findFirst({
    where: { phone: { in: [PHONE, PHONE.replace(/^0/, '+263')] } },
    include: { driverProfile: true },
  });

  if (!user) throw new Error(`No user found for phone ${PHONE}`);
  if (!user.driverProfile) throw new Error(`User ${user.name} has no driver profile`);

  const wallet = await prisma.driverWallet.upsert({
    where: { driverId: user.driverProfile.id },
    create: { driverId: user.driverProfile.id, balance: AMOUNT },
    update: { balance: { increment: AMOUNT } },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'DEPOSIT',
      amount: AMOUNT,
      note: 'Manual top-up by admin',
      status: 'PAID',
    },
  });

  const updated = await prisma.driverWallet.findUnique({ where: { id: wallet.id } });
  console.log(`✓ Added $${AMOUNT} to ${user.name} (${user.phone}). New balance: $${updated?.balance}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
