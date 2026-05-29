import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { requireAuth, requireDriver, requireShipper } from "@/middleware/auth";
import { placeBidSchema, counterBidSchema, bidsQuerySchema } from "@/schemas/bid.schema";
import { placeBid, acceptBid, rejectBid, counterBid, getJobBids, getMyBids } from "@/services/bid.service";

type AuthUser = { id: string; driverProfile?: { id: string } | null };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

export async function bidRoutes(app: FastifyInstance) {
  // Bidding is gated by wallet balance (reserveCommission) and document approval
  // (checked inside placeBid). No subscription required — Loada uses per-job commission.
  app.post("/", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const body = placeBidSchema.parse(req.body);
      const user = getUser(req);
      if (!user.driverProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }
      const bid = await placeBid(body.jobId, user.driverProfile.id, body.offeredPrice);
      return reply.status(201).send({ success: true, data: { bid } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/mine", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const user = getUser(req);
      if (!user.driverProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }
      const bids = await getMyBids(user.driverProfile.id);
      return reply.send({ success: true, data: { bids } });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { jobId } = bidsQuerySchema.parse(req.query);
      const bids = await getJobBids(jobId);
      return reply.send({ success: true, data: { bids } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.patch("/:bidId/accept", { preHandler: [requireShipper] }, async (req, reply) => {
    try {
      const { bidId } = req.params as { bidId: string };
      const user = getUser(req);
      const job = await acceptBid(bidId, user.id);
      return reply.send({ success: true, data: { job } });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.patch("/:bidId/reject", { preHandler: [requireShipper] }, async (req, reply) => {
    try {
      const { bidId } = req.params as { bidId: string };
      const user = getUser(req);
      const bid = await rejectBid(bidId, user.id);
      return reply.send({ success: true, data: { bid } });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.patch("/:bidId/counter", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { bidId } = req.params as { bidId: string };
      const body = counterBidSchema.parse(req.body);
      const user = getUser(req);
      const bid = await counterBid(bidId, user.id, body.newPrice);
      return reply.send({ success: true, data: { bid } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
