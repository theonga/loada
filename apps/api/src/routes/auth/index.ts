import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { sendOTPSchema, verifyOTPSchema, updateProfileSchema } from "@/schemas/auth.schema";
import {
  generateAndSendOTP,
  verifyOTPAndLogin,
  verifyAndRotateRefreshToken,
  logout,
  updateUserProfile,
} from "@/services/auth.service";
import { requireAuth } from "@/middleware/auth";

export async function authRoutes(app: FastifyInstance) {
  app.post("/send-otp", async (req, reply) => {
    try {
      const { phone } = sendOTPSchema.parse(req.body);
      const devOtp = await generateAndSendOTP(phone);
      const data: Record<string, string> = { message: "OTP sent" };
      if (devOtp) data["devOtp"] = devOtp;
      return reply.send({ success: true, data });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      throw err;
    }
  });

  app.post("/verify-otp", async (req, reply) => {
    try {
      const { phone, code, role } = verifyOTPSchema.parse(req.body);
      const { user, accessToken: rawPayload, refreshToken, isNewUser } = await verifyOTPAndLogin(phone, code, role);

      const payload = JSON.parse(rawPayload) as { userId: string; role: string };
      const accessToken = app.jwt.sign(payload, { expiresIn: "15m" });
      const refreshJwt = app.jwt.sign({ userId: payload.userId, type: "refresh" }, { expiresIn: "30d" });

      reply.setCookie("refreshToken", refreshJwt, { httpOnly: true, path: "/v1/auth/refresh", sameSite: "strict" });
      reply.setCookie("rt", refreshToken, { httpOnly: true, path: "/", sameSite: "strict" });

      return reply.send({ success: true, data: { user, accessToken, refreshToken, isNewUser } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.post("/refresh", async (req, reply) => {
    try {
      const body = req.body as { userId?: string; refreshToken?: string };
      const userId = body?.userId;
      const refreshToken = body?.refreshToken;
      if (!userId || !refreshToken) {
        return reply.status(400).send({ success: false, error: { code: "MISSING_FIELDS", message: "userId and refreshToken required" } });
      }
      const tokens = await verifyAndRotateRefreshToken(userId, refreshToken);
      const payload = JSON.parse(tokens.accessToken) as { userId: string; role: string };
      const accessToken = app.jwt.sign(payload, { expiresIn: "15m" });
      return reply.send({ success: true, data: { accessToken, refreshToken: tokens.refreshToken } });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 401).send({ success: false, error: { code: e.code ?? "UNAUTHORIZED", message: e.message } });
    }
  });

  app.post("/logout", { preHandler: [requireAuth] }, async (req, reply) => {
    const user = (req as unknown as Record<string, { id: string }>)["authUser"];
    await logout(user.id);
    reply.clearCookie("refreshToken");
    reply.clearCookie("rt");
    return reply.send({ success: true, data: null });
  });

  app.patch("/me", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { name, email } = updateProfileSchema.parse(req.body);
      const user = (req as unknown as Record<string, { id: string }>)["authUser"];
      await updateUserProfile(user.id, name, email);
      return reply.send({ success: true, data: { name, email } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: err.issues[0]?.message ?? "Invalid input" } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
