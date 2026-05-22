import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { requireAuth } from "@/middleware/auth";
import { submitRatingSchema, ratingsQuerySchema } from "@/schemas/rating.schema";
import { submitRating, getUserAggregateRating } from "@/services/rating.service";
import { prisma } from "@/lib/prisma";

type AuthUser = { id: string };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

export async function ratingRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const body = submitRatingSchema.parse(req.body);
      const user = getUser(req);
      await submitRating(body.jobId, user.id, body.toUserId, body.score, body.tags, body.comment);
      return reply.send({ success: true, data: null });
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
      const { userId } = ratingsQuerySchema.parse(req.query);
      const [ratings, aggregate] = await Promise.all([
        prisma.rating.findMany({
          where: { toUserId: userId },
          orderBy: { createdAt: "desc" },
          include: { fromUser: { select: { id: true, name: true, profilePhotoUrl: true } } },
        }),
        getUserAggregateRating(userId),
      ]);
      return reply.send({ success: true, data: { ratings, aggregate } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
