import crypto from "crypto";

/**
 * Deterministic HMAC-SHA256 of a phone number using PHONE_PEPPER.
 *
 * Used as the indexed lookup key on User.phoneHash so we can find users by
 * phone without storing only-plaintext-or-only-bcrypt. The pepper lives in
 * env (ideally AWS Secrets Manager), separate from the database, so a DB
 * dump alone can't be reversed into the phone list — an attacker would also
 * need the pepper.
 *
 * Output is the hex digest so it fits the existing TEXT column and stays
 * URL/log-safe.
 */
export function hashPhoneLookup(phone: string): string {
  const pepper = process.env.PHONE_PEPPER;
  if (!pepper) {
    throw new Error(
      "PHONE_PEPPER env var is required. Generate one with `openssl rand -hex 32` and store it in your secrets manager.",
    );
  }
  const normalised = phone.trim();
  return crypto.createHmac("sha256", pepper).update(normalised).digest("hex");
}
