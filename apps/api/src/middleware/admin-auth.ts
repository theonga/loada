import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export interface AdminJwtPayload {
  adminId: string;
  username: string;
  type: "admin";
}

// Name of the httpOnly cookie used by the admin panel. Exported so the login
// and logout routes set/clear the same name.
export const ADMIN_SESSION_COOKIE = "admin_session";

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Prefer the httpOnly cookie (admin panel). Fall back to an Authorization
  // header so we can keep CLI scripts and tests working.
  const cookieToken = (req as unknown as { cookies?: Record<string, string> }).cookies?.[ADMIN_SESSION_COOKIE];
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken ?? headerToken;

  if (!token) {
    return reply.status(401).send({ success: false, error: { code: "UNAUTHORIZED", message: "Admin token required" } });
  }

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
