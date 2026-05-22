import { z } from "zod";

export const pickupSchema = z.object({
  photoUri: z.string().min(1),
  discrepancyNote: z.string().optional(),
});

export const deliverySchema = z.object({
  photoUri: z.string().min(1),
  recipientName: z.string().min(1),
  signatureUri: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
