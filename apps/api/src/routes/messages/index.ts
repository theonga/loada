import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { requireAuth } from "@/middleware/auth";
import { sendMessageSchema, messagesQuerySchema } from "@/schemas/message.schema";
import { prisma } from "@/lib/prisma";
import { getSocketServer } from "@/lib/socket";

type AuthUser = { id: string };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

export async function messageRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const body = sendMessageSchema.parse(req.body);
      const user = getUser(req);

      const job = await prisma.job.findUnique({
        where: { id: body.jobId },
        include: { shipper: true, bids: { where: { status: "ACCEPTED" }, include: { driver: true } } },
      });
      if (!job) {
        return reply.status(404).send({ success: false, error: { code: "JOB_NOT_FOUND", message: "Job not found" } });
      }

      const message = await prisma.message.create({
        data: {
          jobId: body.jobId,
          senderId: user.id,
          content: body.content,
          mediaUrl: body.mediaUrl,
          mediaType: body.mediaType,
        },
        include: { sender: { select: { id: true, name: true, profilePhotoUrl: true } } },
      });

      const { chatNs } = getSocketServer();
      chatNs.to(`job:${body.jobId}`).emit("chat:message", message);

      return reply.status(201).send({ success: true, data: { message } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { jobId } = messagesQuerySchema.parse(req.query);
      const user = getUser(req);

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { shipper: true, bids: { where: { status: "ACCEPTED" }, include: { driver: true } } },
      });
      if (!job) {
        return reply.status(404).send({ success: false, error: { code: "JOB_NOT_FOUND", message: "Job not found" } });
      }

      const shipperUserId = job.shipper.userId;
      const driverUserId = job.bids[0]?.driver.userId;
      if (user.id !== shipperUserId && user.id !== driverUserId) {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Access denied" } });
      }

      const messages = await prisma.message.findMany({
        where: { jobId },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, profilePhotoUrl: true } } },
      });

      return reply.send({ success: true, data: { messages } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.patch("/:messageId/read", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { messageId } = req.params as { messageId: string };
      const msg = await prisma.message.update({ where: { id: messageId }, data: { isRead: true } });
      const { chatNs } = getSocketServer();
      chatNs.to(`job:${msg.jobId}`).emit("chat:read", { messageId, readAt: new Date() });
      return reply.send({ success: true, data: null });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
