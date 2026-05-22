import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { z } from "zod";
import { requireAuth } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";

type AuthUser = { id: string };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

const fcmTokenSchema = z.object({ token: z.string().min(1) });

export async function notificationRoutes(app: FastifyInstance) {
  // Stub: notifications stored in DB would require a Notification model.
  // For MVP, notifications are push-only (FCM). This returns an empty list.
  app.get("/", { preHandler: [requireAuth] }, async (_req, reply) => {
    return reply.send({ success: true, data: { notifications: [] } });
  });

  app.patch("/:id/read", { preHandler: [requireAuth] }, async (_req, reply) => {
    return reply.send({ success: true, data: null });
  });

  app.post("/fcm-token", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { token } = fcmTokenSchema.parse(req.body);
      const user = getUser(req);
      await prisma.user.update({ where: { id: user.id }, data: { fcmToken: token } });
      return reply.send({ success: true, data: null });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
