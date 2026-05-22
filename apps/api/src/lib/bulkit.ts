import axios from "axios";

export async function sendSMS(to: string, message: string): Promise<void> {
  if (!process.env.BULKIT_API_KEY) {
    console.warn(`[SMS stub] To: ${to} | Message: ${message}`);
    return;
  }

  try {
    await axios.post(
      "https://bulkit.app/api/sms/send",
      {
        apiKey: process.env.BULKIT_API_KEY,
        senderId: process.env.BULKIT_SENDER_ID ?? "LOADA",
        to,
        message,
      },
      { timeout: 8000 },
    );
  } catch (err) {
    console.error(`[BulkIT] SMS failed to ${to}:`, err);
  }
}

export async function handleDeliveryReport(payload: unknown): Promise<void> {
  console.log("[BulkIT] Delivery report received:", JSON.stringify(payload));
}
