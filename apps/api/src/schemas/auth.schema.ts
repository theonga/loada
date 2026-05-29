import { z } from "zod";

export const sendOTPSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Invalid phone number"),
});

export const verifyOTPSchema = z.object({
  phone: z.string(),
  code: z.string().length(6).regex(/^[0-9]{6}$/),
  role: z.enum(["SHIPPER", "DRIVER"]),
});

export const refreshSchema = z.object({
  userId: z.string().uuid(),
  refreshToken: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email").max(200).nullable().optional(),
});
