import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { smsOTP } from "@/lib/bulkit";
import { getConfigNum } from "@/lib/app-config";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashPhone(phone: string): string {
  return bcrypt.hashSync(phone, 10);
}

export async function generateAndSendOTP(phone: string): Promise<string | null> {
  const otp = generateOTP();
  const otpTtl = await getConfigNum("otp_expiry_seconds");
  await redis.setex(`loada:otp:${phone}`, otpTtl, otp);
  await smsOTP(phone, otp);
  return process.env.NODE_ENV === "development" ? otp : null;
}

export async function verifyOTPAndLogin(
  phone: string,
  code: string,
  role: UserRole,
): Promise<{ user: object; accessToken: string; refreshToken: string; isNewUser: boolean }> {
  const stored = await redis.get(`loada:otp:${phone}`);
  if (!stored || stored !== code) {
    throw Object.assign(new Error("Invalid or expired OTP"), { statusCode: 401, code: "INVALID_OTP" });
  }
  await redis.del(`loada:otp:${phone}`);

  let user = await prisma.user.findUnique({
    where: { phone },
    include: { shipperProfile: true, driverProfile: true },
  });

  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name: "",
        role,
        ...(role === "SHIPPER" || role === "BOTH"
          ? { shipperProfile: { create: {} } }
          : {}),
        ...(role === "DRIVER" || role === "BOTH"
          ? {
              driverProfile: {
                create: {
                  capacityTonnes: 1,
                  truckRegistration: "PENDING",
                  truckMake: "Unknown",
                  truckModel: "Unknown",
                  truckYear: new Date().getFullYear(),
                },
              },
            }
          : {}),
      },
      include: { shipperProfile: true, driverProfile: true },
    });
  }

  const accessToken = await generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);
  return { user, accessToken, refreshToken, isNewUser };
}

export async function updateUserProfile(userId: string, name: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { name } });
}

export async function generateAccessToken(userId: string, role: string): Promise<string> {
  // Token is signed by Fastify's jwt plugin — this returns a signed string
  // The actual signing happens in the route handler using app.jwt.sign()
  // We store the payload here and let the route sign it
  return JSON.stringify({ userId, role, type: "access" });
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const token = require("crypto").randomBytes(64).toString("hex") as string;
  const hash = await bcrypt.hash(token, 10);
  await redis.setex(`loada:refresh:${userId}`, REFRESH_TTL_SECONDS, hash);
  return token;
}

export async function verifyAndRotateRefreshToken(
  userId: string,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const stored = await redis.get(`loada:refresh:${userId}`);
  if (!stored || !(await bcrypt.compare(refreshToken, stored))) {
    throw Object.assign(new Error("Invalid refresh token"), { statusCode: 401, code: "INVALID_REFRESH_TOKEN" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.isSuspended) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401, code: "UNAUTHORIZED" });
  }

  const newRefreshToken = await generateRefreshToken(userId);
  const accessToken = await generateAccessToken(userId, user.role);
  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string): Promise<void> {
  await redis.del(`loada:refresh:${userId}`);
}

// Suppress unused import warning - hashPhone used for future phone hashing
void hashPhone;
