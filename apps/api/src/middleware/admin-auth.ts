import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export interface AdminJwtPayload {
  adminId: string;
  username: string;
  type: "admin";
}

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Admin token required" } });
  }

  const token = authHeader.slice(7);
  let payload: AdminJwtPayload;

  try {
    payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET!) as AdminJwtPayload;
  } catch {
    return reply.status(401).send({ success: false, error: { code: "INVALID_TOKEN", message: "Invalid or expired admin token" } });
  }

  if (payload.type !== "admin") {
    return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Admin access required" } });
  }

  const admin = await prisma.admin.findUnique({ where: { id: payload.adminId } });
  if (!admin) {
    return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Admin account not found" } });
  }

  (req as unknown as Record<string, unknown>)["admin"] = { id: admin.id, username: admin.username };
}

export function getAdmin(req: FastifyRequest): { id: string; username: string } {
  return (req as unknown as Record<string, unknown>)["admin"] as { id: string; username: string };
}
