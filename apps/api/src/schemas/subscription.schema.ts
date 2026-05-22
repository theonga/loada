import { z } from "zod";

export const createSubscriptionSchema = z.object({
  plan: z.enum(["WEEKLY", "MONTHLY", "ANNUAL"]),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/),
});

export const uploadUrlQuerySchema = z.object({
  folder: z.enum(["delivery", "documents", "trucks", "chat"]),
  mimeType: z.string().min(1),
});
