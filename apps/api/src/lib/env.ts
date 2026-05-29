/**
 * Boot-time environment validation.
 *
 * Called once from server.ts before any other module runs. If anything required
 * is missing or malformed we exit immediately with a clear message — better
 * than crashing on the first request to a feature that needs the missing var.
 *
 * Add new required vars here as the platform grows. Optional vars (Sentry,
 * Firebase, etc.) live in the optional schema and just log a warning.
 */

import { z } from "zod";

const requiredSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  PHONE_PEPPER: z.string().min(16, "PHONE_PEPPER must be at least 16 characters (use `openssl rand -hex 32`)"),

  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_REGION: z.string().min(1),

  PAYNOW_INTEGRATION_ID: z.string().min(1),
  PAYNOW_INTEGRATION_KEY: z.string().min(1),
});

// Vars that are nice to have but the API can boot without — we log a warning
// instead of refusing to start so dev environments don't need every external
// integration wired up.
const optionalKeys = [
  "ADMIN_JWT_SECRET",
  "SENTRY_DSN",
  "GOOGLE_MAPS_API_KEY",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_CLIENT_EMAIL",
  "BULKIT_SMS_USERNAME",
  "BULKIT_SMS_PASSWORD",
  "BULKIT_SMS_SENDER",
  "BULKIT_SMS_API_URL",
] as const;

export function validateEnv(): void {
  const result = requiredSchema.safeParse(process.env);
  if (!result.success) {
    console.error("\n[env] Boot aborted — required environment variables are missing or invalid:\n");
    for (const issue of result.error.issues) {
      console.error(`  ✗ ${issue.path.join(".")}: ${issue.message}`);
    }
    console.error("\nSee apps/api/.env.example for the full list.\n");
    process.exit(1);
  }

  const missingOptional = optionalKeys.filter((k) => !process.env[k]);
  if (missingOptional.length > 0) {
    console.warn(
      `[env] Optional env vars not set (features depending on them will degrade): ${missingOptional.join(", ")}`,
    );
  }
}
