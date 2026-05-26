import pino from "pino";

const log = pino({ name: "bulkit-sms" });

// ─── Phone normalisation ──────────────────────────────────────────────────────
// Zimbabwe numbers must arrive at BulkIT as 263XXXXXXXXX (no + or leading 0).
// International numbers: strip + only.

export function normalisePhone(raw: string): string {
  let n = raw.replace(/[\s\-\(\)]/g, ""); // strip whitespace/separators
  if (n.startsWith("+")) n = n.slice(1);  // strip +
  if (n.startsWith("0")) n = "263" + n.slice(1); // 0XXXXXXXXX → 263XXXXXXXXX
  return n;
}

// ─── Config ───────────────────────────────────────────────────────────────────

function cfg() {
  return {
    url: process.env.BULKIT_SMS_API_URL ?? "https://api.npr.bulkit.co.zw/api/messages/send",
    username: process.env.BULKIT_SMS_USERNAME ?? "",
    password: process.env.BULKIT_SMS_PASSWORD ?? "",
    sender:   process.env.BULKIT_SMS_SENDER   ?? "LOADA",
  };
}

const isDryRun = (): boolean =>
  process.env.SMS_DRY_RUN === "true" || process.env.DEBUG === "true";

// ─── Core send ───────────────────────────────────────────────────────────────

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const phone = normalisePhone(to);
  const { url, username, password, sender } = cfg();

  if (isDryRun()) {
    log.info({ phone, message }, "SMS dry-run — skipped");
    return true;
  }

  if (!username || !password) {
    log.warn({ phone }, "BulkIT credentials not configured — SMS skipped");
    return false;
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  const controller  = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${credentials}`,
      },
      body: JSON.stringify({ from: sender, text: message, to: phone }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.status === 200 || res.status === 201) {
      log.info({ phone, status: res.status }, "SMS sent");
      return true;
    }

    const body = await res.text().catch(() => "");
    log.error({ phone, status: res.status, body }, "SMS send failed — non-success status");
    return false;
  } catch (err) {
    clearTimeout(timer);
    const isTimeout = (err as Error).name === "AbortError";
    log.error(
      { phone, error: isTimeout ? "timeout (15s)" : (err as Error).message },
      "SMS network error",
    );
    return false;
  }
}

// ─── Notification helpers ─────────────────────────────────────────────────────

export function smsOTP(phone: string, code: string): Promise<boolean> {
  return sendSMS(phone, `Your Loada verification code is ${code}. Valid for 10 minutes. Do not share it.`);
}

export function smsWelcome(phone: string, name: string): Promise<boolean> {
  return sendSMS(phone, `Welcome to Loada, ${name}! Your account is ready. Open the app to start.`);
}

export function smsMatchConfirmedDriver(
  phone: string,
  originAddress: string,
): Promise<boolean> {
  return sendSMS(
    phone,
    `Loada: You got the load! Pickup at ${originAddress}. Open the app for details.`,
  );
}

export function smsMatchConfirmedShipper(
  phone: string,
  driverName: string,
): Promise<boolean> {
  return sendSMS(
    phone,
    `Loada: ${driverName} accepted your load and is on the way. Open the app to track.`,
  );
}

export function smsDeliveryComplete(phone: string): Promise<boolean> {
  return sendSMS(phone, "Loada: Your load has been delivered. Open the app to confirm and rate your driver.");
}

export function smsSubscriptionActive(phone: string, plan: string): Promise<boolean> {
  return sendSMS(phone, `Loada: Your ${plan} subscription is active. Start browsing loads.`);
}

export function smsSubscriptionExpiringSoon(phone: string, plan: string, hoursLeft: number): Promise<boolean> {
  return sendSMS(
    phone,
    `Loada: Your ${plan} subscription expires in ${hoursLeft} hours. Renew in the app to keep access.`,
  );
}

export function smsSubscriptionExpired(phone: string): Promise<boolean> {
  return sendSMS(phone, "Loada: Your subscription has expired. Renew in the app to access loads.");
}

// ─── Delivery report webhook ──────────────────────────────────────────────────

export function handleDeliveryReport(payload: unknown): void {
  log.info({ payload }, "BulkIT delivery report received");
}
