import { z } from "zod";

export const sendMessageSchema = z.object({
  jobId: z.string().uuid(),
  content: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "voice"]).optional(),
}).refine((d) => d.content || d.mediaUrl, { message: "content or mediaUrl required" });

export const messagesQuerySchema = z.object({
  jobId: z.string().uuid(),
});
