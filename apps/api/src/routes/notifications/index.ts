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
  app.get("/", { preHandler: [requireAuth] }, async (req, reply) => {
    const user = getUser(req);
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return reply.send({ success: true, data: { notifications } });
  });

  app.patch("/:id/read", { preHandler: [requireAuth] }, async (req, reply) => {
    const user = getUser(req);
    const { id } = req.params as { id: string };
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    return reply.send({ success: true, data: null });
  });

  app.patch("/read-all", { preHandler: [requireAuth] }, async (req, reply) => {
    const user = getUser(req);
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
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
