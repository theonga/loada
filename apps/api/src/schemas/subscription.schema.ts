import { z } from "zod";

export const createSubscriptionSchema = z
  .object({
    plan: z.enum(["WEEKLY", "MONTHLY", "ANNUAL"]),
    method: z.enum(["ecocash", "onemoney", "vmc"]).default("ecocash"),
    // Required for mobile money; optional for card (vmc)
    phone: z.string().regex(/^\+?[0-9]{7,15}$/).optional(),
    // Optional email shown on Paynow's card page
    email: z.string().email().optional(),
  })
  .refine((d) => d.method === "vmc" || !!d.phone, {
    message: "Phone is required for mobile money payments",
    path: ["phone"],
  });

export const uploadUrlQuerySchema = z.object({
  folder: z.enum(["delivery", "documents", "trucks", "chat"]),
  mimeType: z.string().min(1),
});
