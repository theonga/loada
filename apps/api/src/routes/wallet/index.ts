import type { FastifyPluginAsync } from "fastify";
import { requireDriver } from "@/middleware/auth";
import { getWallet, getWalletTransactions, initiateDeposit } from "@/services/wallet.service";
import { getConfigNum } from "@/lib/app-config";
import { initiatePayment, type PaynowMethod } from "@/lib/paynow";
import { paynowPollQueue } from "@/lib/queues";
import { prisma } from "@/lib/prisma";
import type { PaymentStatus } from "@prisma/client";

type AuthUser = { id: string; driverProfile?: { id: string } | null };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

// Paynow requires local Zimbabwe format: 07XXXXXXXX (no +, no spaces, no country code)
function normalizeZimbabwePhone(phone: string): string {
  let p = phone.replace(/[\s\-\(\)\.]/g, "");
  if (p.startsWith("+263")) p = "0" + p.slice(4);
  else if (p.startsWith("263")) p = "0" + p.slice(3);
  return p;
}

const walletRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /wallet/me — balance + commission pct
  fastify.get("/me", { preHandler: [requireDriver] }, async (request, reply) => {
    const user = getUser(request);
    if (!user.driverProfile) {
      return reply.code(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
    }
    const wallet = await getWallet(user.driverProfile.id);
    return reply.send({ success: true, data: wallet });
  });

  // GET /wallet/me/transactions
  fastify.get("/me/transactions", { preHandler: [requireDriver] }, async (request, reply) => {
    const user = getUser(request);
    if (!user.driverProfile) {
      return reply.code(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
    }
    const txs = await getWalletTransactions(user.driverProfile.id);
    return reply.send({ success: true, data: { transactions: txs } });
  });

  // POST /wallet/deposit — initiate a Paynow deposit
  fastify.post<{ Body: { amount: number; method: string; phone?: string; email?: string } }>(
    "/deposit",
    { preHandler: [requireDriver] },
    async (request, reply) => {
      const user = getUser(request);
      if (!user.driverProfile) {
        return reply.code(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }

      const { amount, method, phone, email } = request.body;

      if (!amount || amount <= 0) {
        return reply.code(400).send({ success: false, error: { code: "INVALID_AMOUNT", message: "Invalid amount" } });
      }

      const minDeposit = await getConfigNum("min_deposit_usd");
      if (amount < minDeposit) {
        return reply.code(400).send({
          success: false,
          error: { code: "BELOW_MIN_DEPOSIT", message: `Minimum deposit is $${minDeposit}` },
        });
      }

      const validMethods: PaynowMethod[] = ["ecocash", "onemoney", "vmc"];
      if (!validMethods.includes(method as PaynowMethod)) {
        return reply.code(400).send({ success: false, error: { code: "INVALID_METHOD", message: "Invalid payment method" } });
      }

      const needsPhone = method === "ecocash" || method === "onemoney";
      if (needsPhone && !phone?.trim()) {
        return reply.code(400).send({
          success: false,
          error: { code: "PHONE_REQUIRED", message: "Phone number is required for mobile money payments" },
        });
      }

      // Generate a stable reference we send to Paynow — used to match the result webhook back
      const reference = `loada-dep-${user.driverProfile.id}-${Date.now()}`;

      // Create pending transaction first (idempotency — if Paynow call fails we still have a record)
      const tx = await initiateDeposit(user.driverProfile.id, amount, reference);

      // Normalise phone to the local Zimbabwe format Paynow requires (07XXXXXXXX)
      const normalisedPhone = needsPhone ? normalizeZimbabwePhone(phone!) : "";

      // authemail: use driver's saved email if set, otherwise fall back to merchant env
      const userRecord = await prisma.user.findUnique({ where: { id: user.id }, select: { email: true } });
      const authEmail = userRecord?.email?.trim() || process.env.PAYNOW_AUTH_EMAIL || "";

      try {
        const payment = await initiatePayment({
          reference,
          amount,
          method:      method as PaynowMethod,
          phone:       normalisedPhone,
          email:       authEmail,
          description: "Loada wallet top-up",
        });

        // Schedule polling as backup — resulturl webhook is the primary confirmation path
        await paynowPollQueue.add("poll", {
          type:                "wallet",
          walletTransactionId: tx.id,
          pollUrl:             payment.pollUrl,
          attemptCount:        0,
        });

        return reply.code(201).send({
          success: true,
          data: {
            transactionId: tx.id,
            pollUrl:       payment.pollUrl,
            redirectUrl:   payment.redirectUrl,
            amount,
            method,
          },
        });
      } catch (err) {
        // Mark the pending transaction as failed so the driver can retry
        await prisma.walletTransaction.update({
          where: { id: tx.id },
          data: { status: "FAILED" as PaymentStatus },
        });

        const msg = (err as Error).message ?? "Payment initiation failed";
        request.log.error({ err, reference }, "[Paynow] deposit initiation failed");
        return reply.code(502).send({
          success: false,
          error: { code: "PAYNOW_ERROR", message: msg },
        });
      }
    },
  );
};

export default walletRoutes;
