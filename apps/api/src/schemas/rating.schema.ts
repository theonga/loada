import { z } from "zod";

export const submitRatingSchema = z.object({
  jobId: z.string().uuid(),
  toUserId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  tags: z.array(z.enum(["ON_TIME", "CAREFUL_WITH_CARGO", "PROFESSIONAL", "GOOD_COMMUNICATION"])),
  comment: z.string().max(500).optional(),
});

export const ratingsQuerySchema = z.object({
  userId: z.string().uuid(),
});
