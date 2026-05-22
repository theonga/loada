import { z } from "zod";

export const createJobSchema = z.object({
  originAddress: z.string().min(5),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  destAddress: z.string().min(5),
  destLat: z.number().min(-90).max(90),
  destLng: z.number().min(-180).max(180),
  cargoDescription: z.string().min(3).max(500),
  requiredTonnes: z.union([
    z.literal(1), z.literal(2), z.literal(5),
    z.literal(10), z.literal(20), z.literal(30),
  ]),
  specialRequirements: z.array(z.enum(["FRAGILE", "REFRIGERATED", "OVERSIZED", "HAZARDOUS"])).default([]),
  askingPrice: z.number().positive().max(100000),
  currency: z.string().length(3).default("USD"),
});

export const jobsQuerySchema = z.object({
  role: z.enum(["shipper", "driver"]).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  status: z.string().optional(),
});

export const marketRefQuerySchema = z.object({
  tonnes: z.coerce.number(),
});

// Driver-initiated status transitions only
export const jobStatusUpdateSchema = z.object({
  status: z.enum(["PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "IN_TRANSIT"]),
});
