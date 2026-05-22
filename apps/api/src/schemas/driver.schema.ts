import { z } from "zod";

export const updateDriverSchema = z.object({
  truckMake: z.string().optional(),
  truckModel: z.string().optional(),
  truckYear: z.number().int().min(1990).max(2030).optional(),
  truckRegistration: z.string().optional(),
});

export const driverOnlineSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const earningsQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});
