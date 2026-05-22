import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { requireAuth, requireDriver } from "@/middleware/auth";
import { pickupSchema, deliverySchema } from "@/schemas/delivery.schema";
import { confirmPickup, confirmDelivery, getPOD } from "@/services/delivery.service";

type AuthUser = { id: string; driverProfile?: { id: string } | null };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

export async function deliveryRoutes(app: FastifyInstance) {
  app.post("/:jobId/pickup", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const body = pickupSchema.parse(req.body);
      const user = getUser(req);
      if (!user.driverProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }
      await confirmPickup(jobId, user.driverProfile.id, body.photoUri, body.discrepancyNote);
      const delivery = await import("@/lib/prisma").then(({ prisma }) =>
        prisma.delivery.findUnique({ where: { jobId } }),
      );
      return reply.send({ success: true, data: { delivery } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.post("/:jobId/confirm", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const body = deliverySchema.parse(req.body);
      const user = getUser(req);
      if (!user.driverProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }
      await confirmDelivery(jobId, user.driverProfile.id, body.photoUri, body.recipientName, body.signatureUri, body.lat, body.lng);
      const delivery = await import("@/lib/prisma").then(({ prisma }) =>
        prisma.delivery.findUnique({ where: { jobId } }),
      );
      return reply.send({ success: true, data: { delivery } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/:jobId/pod", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const pod = await getPOD(jobId);
      return reply.send({ success: true, data: { pod } });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
