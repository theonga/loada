import type { FastifyPluginAsync } from "fastify";
import { verifyResponseHash } from "@/lib/paynow";
import { confirmDeposit } from "@/services/wallet.service";
import { prisma } from "@/lib/prisma";

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /v1/payments/result
   *
   * Paynow server-to-server webhook called whenever a payment status changes.
   * Body is application/x-www-form-urlencoded.
   * Must always return HTTP 200 — Paynow will retry on non-200.
   */
  fastify.post("/result", async (request, reply) => {
    const body = request.body as Record<string, string>;

    // Separate the hash from the rest of the fields (preserve insertion order)
    const { hash, ...fields } = body;

    if (!hash) {
      request.log.warn("[Paynow] Result webhook received with no hash — ignoring");
      return reply.code(200).send("ok");
    }

    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY!;
    if (!verifyResponseHash(fields, hash, integrationKey)) {
      request.log.warn({ fields }, "[Paynow] Result webhook hash mismatch — ignoring");
      return reply.code(200).send("ok");
    }

    const reference  = fields["reference"];
    const status     = fields["status"];
    const paynowRef  = fields["paynowreference"] ?? "";

    const isPaid = status === "Paid" || status === "Awaiting Delivery" || status === "Delivered";

    request.log.info({ reference, status, paynowRef }, "[Paynow] Result webhook received");

    if (!isPaid || !reference) {
      return reply.code(200).send("ok");
    }

    // All Paynow payments are wallet deposits — no subscriptions on this platform.
    const walletTx = await prisma.walletTransaction.findFirst({
      where: { paynowRef: reference, type: "DEPOSIT", status: "PENDING" },
    });

    if (walletTx) {
      await confirmDeposit(walletTx.id).catch((err) => {
        request.log.error({ err, transactionId: walletTx.id }, "[Paynow] confirmDeposit failed");
      });
    }

    void paynowRef;
    return reply.code(200).send("ok");
  });

  /**
   * GET /v1/payments/return
   *
   * Browser redirect after a card (VMC) payment is completed.
   * For EcoCash/OneMoney this URL is not visited — confirmation comes via resulturl.
   */
  fastify.get("/return", async (_request, reply) => {
    // Deep-link back into the app on the wallet screen
    return reply.redirect("loada://wallet?deposit=success");
  });
};
