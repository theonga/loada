import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { requireDriver } from "@/middleware/auth";
import { createSubscriptionSchema, uploadUrlQuerySchema } from "@/schemas/subscription.schema";
import { createSubscription } from "@/services/subscription.service";
import { getUploadPresignedUrl } from "@/lib/s3";
import { prisma } from "@/lib/prisma";

type AuthUser = { id: string; driverProfile?: { id: string } | null };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

export async function subscriptionRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const body = createSubscriptionSchema.parse(req.body);
      const user = getUser(req);
      if (!user.driverProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }
      const result = await createSubscription(user.driverProfile.id, body.plan, body.method, body.phone, body.email);
      return reply.status(201).send({ success: true, data: result });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/me", { preHandler: [requireDriver] }, async (req, reply) => {
    const user = getUser(req);
    if (!user.driverProfile) {
      return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
    }
    const subscription = await prisma.subscription.findUnique({
      where: { driverId: user.driverProfile.id },
      include: { payments: { orderBy: { createdAt: "desc" } } },
    });
    return reply.send({ success: true, data: { subscription, payments: subscription?.payments ?? [] } });
  });

  app.patch("/:id/cancel", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const user = getUser(req);
      const sub = await prisma.subscription.findUnique({ where: { id } });
      if (!sub || sub.driverId !== user.driverProfile?.id) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Subscription not found" } });
      }
      const updated = await prisma.subscription.update({ where: { id }, data: { status: "CANCELLED" } });
      return reply.send({ success: true, data: { subscription: updated } });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/upload-url", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const query = uploadUrlQuerySchema.parse(req.query);
      const { uploadUrl, fileKey } = await getUploadPresignedUrl(query.folder, query.mimeType);
      return reply.send({ success: true, data: { uploadUrl, fileKey } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
