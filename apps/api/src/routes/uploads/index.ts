import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { ZodError } from "zod";
import { requireAuth } from "@/middleware/auth";
import { getUploadPresignedUrl, getDownloadPresignedUrl } from "@/lib/s3";

const ALLOWED_PURPOSES = ["pickup", "delivery", "document", "truck", "chat"] as const;
type Purpose = (typeof ALLOWED_PURPOSES)[number];

const PURPOSE_FOLDER: Record<Purpose, "delivery" | "documents" | "trucks" | "chat"> = {
  pickup: "delivery",
  delivery: "delivery",
  document: "documents",
  truck: "trucks",
  chat: "chat",
};

const presignSchema = z.object({
  purpose: z.enum(ALLOWED_PURPOSES),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp|heic)$/, "Only image uploads are allowed"),
});

const confirmSchema = z.object({
  s3Key: z.string().min(1),
});

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/presign", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { purpose, mimeType } = presignSchema.parse(req.body);
      const folder = PURPOSE_FOLDER[purpose];
      const { uploadUrl, fileKey } = await getUploadPresignedUrl(folder, mimeType);
      return reply.send({
        success: true,
        data: { presignedUrl: uploadUrl, s3Key: fileKey },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  // After mobile uploads directly to S3, it calls this to get a signed download URL
  app.post("/confirm", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { s3Key } = confirmSchema.parse(req.body);
      const url = await getDownloadPresignedUrl(s3Key);
      return reply.send({ success: true, data: { url } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
