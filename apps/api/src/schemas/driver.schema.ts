import { z } from "zod";

export const updateDriverSchema = z.object({
  truckType: z.enum(["PICKUP", "TRUCK", "BOX_TRUCK", "TOW_TRUCK"]).optional(),
  truckMake: z.string().optional(),
  truckModel: z.string().optional(),
  truckYear: z.number().int().min(1990).max(2030).optional(),
  truckRegistration: z.string().optional(),
  capacityTonnes: z.union([
    z.literal(1), z.literal(1.5), z.literal(2), z.literal(5),
    z.literal(10), z.literal(20), z.literal(30),
  ]).optional(),
  licenceUrl: z.string().url().optional(),
  licenceBackUrl: z.string().url().optional(),
  licenceExpiry: z.string().datetime({ offset: true }).optional(),
  registrationUrl: z.string().url().optional(),
  registrationExpiry: z.string().datetime({ offset: true }).optional(),
  truckPhotoUrl: z.string().url().optional(),
  vehicleSidePhotoUrl: z.string().url().optional(),
});

export const driverOnlineSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const earningsQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});
