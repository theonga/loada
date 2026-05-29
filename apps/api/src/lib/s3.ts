import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";

export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function getUploadPresignedUrl(
  folder: "delivery" | "documents" | "trucks" | "chat",
  mimeType: string,
): Promise<{ uploadUrl: string; fileKey: string }> {
  const fileKey = `${folder}/${uuid()}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
    ContentType: mimeType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  return { uploadUrl, fileKey };
}

export async function getDownloadPresignedUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: fileKey,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

/**
 * Resolve a stored S3 reference to a fresh presigned download URL.
 *
 * Accepts:
 *   - null/undefined           → returns null (no file)
 *   - "documents/uuid-abc"     → standard S3 key, presigns it
 *   - "https://…amazonaws.com" → legacy field migrated to a URL by an older
 *                                code path; the path component is the key,
 *                                so we strip the host and presign that.
 *
 * Always returns a 1-hour-fresh URL or null. Never returns a stale URL.
 */
export async function resolveStoredFile(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  // Legacy data: full URL with the key embedded as the path. The S3 hostname
  // contains "amazonaws.com" — for any value that looks like a URL we extract
  // the path and treat it as the key.
  let key = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value);
      // The bucket name appears either as a subdomain (virtual-hosted) or as
      // the first path segment (path-style). pathname is "/<bucket>/<key>" in
      // the path-style case and "/<key>" in the virtual-hosted case.
      key = u.pathname.replace(/^\/+/, "");
      const bucket = process.env.AWS_S3_BUCKET;
      if (bucket && key.startsWith(`${bucket}/`)) {
        key = key.slice(bucket.length + 1);
      }
    } catch {
      return null;
    }
  }
  return getDownloadPresignedUrl(key);
}

/**
 * Convenience batch helper: takes an object whose values may be S3 references
 * and returns the same shape with each value resolved to a fresh URL (or null).
 */
export async function resolveStoredFiles<T extends Record<string, string | null | undefined>>(
  refs: T,
): Promise<Record<keyof T, string | null>> {
  const entries = await Promise.all(
    Object.entries(refs).map(async ([k, v]) => [k, await resolveStoredFile(v)] as const),
  );
  return Object.fromEntries(entries) as Record<keyof T, string | null>;
}
