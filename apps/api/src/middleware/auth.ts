import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma";

interface JwtPayload {
  userId: string;
  role: string;
}

export async function requireAuth(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();
    const payload = req.user as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { driverProfile: true, shipperProfile: true },
    });
    if (!user || user.isSuspended) {
      await reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Unauthorized" },
      });
      return;
    }
    (req as unknown as Record<string, unknown>)["authUser"] = user;
  } catch {
    await reply.status(401).send({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  }
}

export async function requireDriver(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;
  const user = (req as unknown as Record<string, unknown>)["authUser"] as { role: string } | undefined;
  if (user?.role !== "DRIVER" && user?.role !== "BOTH") {
    await reply.status(403).send({
      success: false,
      error: { code: "FORBIDDEN", message: "Driver access required" },
    });
  }
}

export async function requireShipper(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  await requireAuth(req, reply);
  if (reply.sent) return;
  const user = (req as unknown as Record<string, unknown>)["authUser"] as { role: string } | undefined;
  if (user?.role !== "SHIPPER" && user?.role !== "BOTH") {
    await reply.status(403).send({
      success: false,
      error: { code: "FORBIDDEN", message: "Shipper access required" },
    });
  }
}

