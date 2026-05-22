import { z } from "zod";

export const placeBidSchema = z.object({
  jobId: z.string().uuid(),
  offeredPrice: z.number().positive().max(100000),
});

export const counterBidSchema = z.object({
  newPrice: z.number().positive().max(100000),
});

export const bidsQuerySchema = z.object({
  jobId: z.string().uuid(),
});
