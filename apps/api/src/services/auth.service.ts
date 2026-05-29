import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { smsOTP } from "@/lib/bulkit";
import { getConfigNum } from "@/lib/app-config";
import bcrypt from "bcryptjs";
import { UserRole, type Prisma } from "@prisma/client";

type UserWithProfiles = Prisma.UserGetPayload<{
  include: { shipperProfile: true; driverProfile: true };
}>;

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
  requestedRole: UserRole,
): Promise<{ user: object; accessToken: string; refreshToken: string; isNewUser: boolean; activeRole: UserRole }> {
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
    // New signup: create user with only the requested role's profile.
    user = await prisma.user.create({
      data: {
        phone,
        name: "",
        role: requestedRole,
        ...(requestedRole === "SHIPPER" || requestedRole === "BOTH"
          ? { shipperProfile: { create: {} } }
          : {}),
        ...(requestedRole === "DRIVER" || requestedRole === "BOTH"
          ? { driverProfile: { create: defaultDriverProfile() } }
          : {}),
      },
      include: { shipperProfile: true, driverProfile: true },
    });
  } else {
    // Existing user: if they pick a role they don't yet have, upgrade them to BOTH
    // and create the missing profile. This avoids the "shipper signed up, picked
    // driver later, dropped into an empty driver UI" trap.
    user = await ensureProfileForRole(user, requestedRole);
  }

  // The "active role" returned to the client governs which UI they see right after
  // login. For BOTH users we honour the role they picked at the role screen; the
  // mobile auth store persists this and exposes a switcher.
  const activeRole = resolveActiveRole(user.role, requestedRole);

  const accessToken = await generateAccessToken(user.id, activeRole);
  const refreshToken = await generateRefreshToken(user.id);
  return { user, accessToken, refreshToken, isNewUser, activeRole };
}

function defaultDriverProfile() {
  return {
    capacityTonnes: 1,
    truckRegistration: "PENDING",
    truckMake: "Unknown",
    truckModel: "Unknown",
    truckYear: new Date().getFullYear(),
  };
}

async function ensureProfileForRole(
  user: UserWithProfiles,
  requestedRole: UserRole,
): Promise<UserWithProfiles> {
  const hasShipper = user.shipperProfile != null;
  const hasDriver = user.driverProfile != null;

  const needsShipper = requestedRole === "SHIPPER" && !hasShipper;
  const needsDriver = requestedRole === "DRIVER" && !hasDriver;

  if (!needsShipper && !needsDriver) return user;

  // The user already has one role and is now asking for the other — upgrade to BOTH
  // and create the missing profile. We never silently downgrade an existing role.
  const newRole: UserRole = "BOTH";

  return prisma.user.update({
    where: { id: user.id },
    data: {
      role: newRole,
      ...(needsShipper ? { shipperProfile: { create: {} } } : {}),
      ...(needsDriver ? { driverProfile: { create: defaultDriverProfile() } } : {}),
    },
    include: { shipperProfile: true, driverProfile: true },
  });
}

function resolveActiveRole(userRole: UserRole, requestedRole: UserRole): UserRole {
  // Single-role users always see their one role.
  if (userRole !== "BOTH") return userRole;
  // BOTH users: honour their pick at the role screen, fall back to SHIPPER.
  if (requestedRole === "DRIVER" || requestedRole === "SHIPPER") return requestedRole;
  return "SHIPPER";
}

export async function switchActiveRole(userId: string, newRole: UserRole): Promise<{ accessToken: string; activeRole: UserRole }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shipperProfile: true, driverProfile: true },
  });
  if (!user) throw Object.assign(new Error("Not found"), { statusCode: 404, code: "USER_NOT_FOUND" });

  const wantsShipper = newRole === "SHIPPER";
  const wantsDriver = newRole === "DRIVER";

  // Switching is only meaningful for BOTH users. SHIPPER/DRIVER stay where they are.
  if (user.role !== "BOTH") {
    if ((wantsShipper && user.role !== "SHIPPER") || (wantsDriver && user.role !== "DRIVER")) {
      throw Object.assign(
        new Error("This account only has one role. Re-login with the other role to upgrade."),
        { statusCode: 400, code: "ROLE_UPGRADE_REQUIRED" },
      );
    }
  }

  if (wantsShipper && !user.shipperProfile) {
    throw Object.assign(new Error("No shipper profile on this account"), { statusCode: 400, code: "NO_SHIPPER_PROFILE" });
  }
  if (wantsDriver && !user.driverProfile) {
    throw Object.assign(new Error("No driver profile on this account"), { statusCode: 400, code: "NO_DRIVER_PROFILE" });
  }

  const accessToken = await generateAccessToken(userId, newRole);
  return { accessToken, activeRole: newRole };
}

export async function updateUserProfile(userId: string, name?: string, email?: string | null): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email || null }),
    },
  });
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
