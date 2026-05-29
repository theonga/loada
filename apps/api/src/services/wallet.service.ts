import { prisma } from "@/lib/prisma";
import { getConfigNum } from "@/lib/app-config";
import { notifyDriver } from "./notification.service";
import type { WalletTxType, PaymentStatus } from "@prisma/client";

export async function getOrCreateWallet(driverId: string) {
  return prisma.driverWallet.upsert({
    where: { driverId },
    create: { driverId, balance: 0, reservedBalance: 0 },
    update: {},
  });
}

export async function getWallet(driverId: string) {
  const wallet = await getOrCreateWallet(driverId);
  const commissionPct = await getConfigNum("loada_commission_pct");
  return {
    balance: parseFloat(wallet.balance.toString()),
    reservedBalance: parseFloat(wallet.reservedBalance.toString()),
    commissionPct,
  };
}

export async function getWalletTransactions(driverId: string, limit = 20) {
  const wallet = await getOrCreateWallet(driverId);
  return prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function reserveCommission(
  driverId: string,
  bidId: string,
  jobId: string,
  commissionAmount: number,
) {
  const wallet = await getOrCreateWallet(driverId);
  const currentBalance = parseFloat(wallet.balance.toString());

  if (currentBalance < commissionAmount) {
    throw Object.assign(
      new Error(`Insufficient wallet balance. You need $${commissionAmount.toFixed(2)} to place this bid.`),
      { statusCode: 402, code: "INSUFFICIENT_WALLET_BALANCE", requiredAmount: commissionAmount, currentBalance },
    );
  }

  await prisma.$transaction([
    prisma.driverWallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: commissionAmount },
        reservedBalance: { increment: commissionAmount },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "COMMISSION_RESERVE" as WalletTxType,
        amount: commissionAmount,
        bidId,
        jobId,
        note: "Commission reserved for bid",
        status: "PAID" as PaymentStatus,
      },
    }),
  ]);
}

export async function releaseCommission(
  driverId: string,
  bidId: string,
  commissionAmount: number,
  reason: string,
) {
  const wallet = await getOrCreateWallet(driverId);

  await prisma.$transaction([
    prisma.driverWallet.update({
      where: { id: wallet.id },
      data: {
        reservedBalance: { decrement: commissionAmount },
        balance: { increment: commissionAmount },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "COMMISSION_RELEASE" as WalletTxType,
        amount: commissionAmount,
        bidId,
        note: reason,
        status: "PAID" as PaymentStatus,
      },
    }),
  ]);
}

export async function deductCommission(
  driverId: string,
  bidId: string,
  jobId: string,
  commissionAmount: number,
) {
  const wallet = await getOrCreateWallet(driverId);
  const reserved = parseFloat(wallet.reservedBalance.toString());

  // The amount we want to charge may not match what was previously reserved
  // (legacy bids with null commissionAmount, commission_pct changed between
  // bid time and settlement, etc.). Take what's reserved first, then pull the
  // shortfall from the available balance. Note is annotated so admin sees it
  // in the wallet history.
  const fromReserved = Math.min(reserved, commissionAmount);
  const shortfall = Math.max(0, commissionAmount - reserved);

  let note = "Loada platform fee";
  if (shortfall > 0) {
    note = `Loada platform fee (reserved $${fromReserved.toFixed(2)} + balance $${shortfall.toFixed(2)})`;
  }

  await prisma.$transaction([
    prisma.driverWallet.update({
      where: { id: wallet.id },
      data: {
        reservedBalance: { decrement: fromReserved },
        ...(shortfall > 0 ? { balance: { decrement: shortfall } } : {}),
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "COMMISSION_DEDUCT" as WalletTxType,
        amount: commissionAmount,
        bidId,
        jobId,
        note,
        status: "PAID" as PaymentStatus,
      },
    }),
  ]);
}

export async function initiateDeposit(
  driverId: string,
  amount: number,
  paynowRef: string,
) {
  const wallet = await getOrCreateWallet(driverId);
  const minDeposit = await getConfigNum("min_deposit_usd");

  if (amount < minDeposit) {
    throw Object.assign(
      new Error(`Minimum deposit is $${minDeposit}`),
      { statusCode: 400, code: "BELOW_MIN_DEPOSIT" },
    );
  }

  const tx = await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: "DEPOSIT" as WalletTxType,
      amount,
      paynowRef,
      note: "Wallet top-up",
      status: "PENDING" as PaymentStatus,
    },
  });

  return tx;
}

export async function confirmDeposit(transactionId: string) {
  const tx = await prisma.walletTransaction.findUnique({
    where: { id: transactionId },
    include: { wallet: true },
  });

  if (!tx || tx.type !== "DEPOSIT" || tx.status !== "PENDING") {
    throw Object.assign(new Error("Transaction not found or already processed"), { statusCode: 404 });
  }

  const amount = parseFloat(tx.amount.toString());

  await prisma.$transaction([
    prisma.walletTransaction.update({
      where: { id: transactionId },
      data: { status: "PAID" as PaymentStatus },
    }),
    prisma.driverWallet.update({
      where: { id: tx.walletId },
      data: { balance: { increment: amount } },
    }),
  ]);

  const updatedWallet = await prisma.driverWallet.findUnique({ where: { id: tx.walletId } });
  const newBalance = parseFloat((updatedWallet?.balance ?? 0).toString());

  // Notify the driver's open wallet screen in real-time
  try {
    const { jobsNs } = (await import("@/lib/socket")).getSocketServer();
    jobsNs.to(`driver:${tx.wallet.driverId}`).emit("wallet:balance_updated", { balance: newBalance });
  } catch {
    // socket not yet initialised — push notification below covers it
  }

  notifyDriver(
    tx.wallet.driverId,
    "Wallet funded",
    `$${amount.toFixed(2)} has been added to your Loada wallet.`,
    { screen: "wallet" },
  ).catch(() => {});
}

export async function checkBidCancelAbuse(driverId: string): Promise<void> {
  const maxCancels = await getConfigNum("max_bid_cancel_per_week");
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const cancelCount = await prisma.bid.count({
    where: {
      driverId,
      status: "REJECTED",
      updatedAt: { gte: oneWeekAgo },
    },
  });

  if (cancelCount >= maxCancels) {
    throw Object.assign(
      new Error(`You have cancelled too many bids this week. Limit is ${maxCancels}/week to prevent abuse.`),
      { statusCode: 429, code: "BID_CANCEL_ABUSE_LIMIT" },
    );
  }
}
