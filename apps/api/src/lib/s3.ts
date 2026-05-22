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
