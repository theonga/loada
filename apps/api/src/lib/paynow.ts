import axios from "axios";
import crypto from "crypto";

export type PaynowMethod = "ecocash" | "onemoney" | "vmc";

function generateHash(values: string[], integrationKey: string): string {
  const str = values.join("") + integrationKey;
  return crypto.createHash("sha512").update(str).digest("hex").toUpperCase();
}

export async function initiatePayment(params: {
  reference: string;
  amount: number;
  phone?: string;
  email?: string;
  description: string;
  method: PaynowMethod;
}): Promise<{ pollUrl: string; redirectUrl: string }> {
  const { reference, amount, phone = "", email = "", description, method } = params;

  const fields: Record<string, string> = {
    id: process.env.PAYNOW_INTEGRATION_ID!,
    reference,
    amount: amount.toFixed(2),
    additionalinfo: description,
    authemail: email,
    phone,
    method,
    returnurl: `${process.env.API_BASE_URL ?? "https://api.loada.app"}/v1/payments/return`,
    resulturl: `${process.env.API_BASE_URL ?? "https://api.loada.app"}/v1/payments/result`,
    status: "Message",
  };

  const hash = generateHash(Object.values(fields), process.env.PAYNOW_INTEGRATION_KEY!);

  const endpoint =
    method === "vmc"
      ? "https://www.paynow.co.zw/interface/remotetransaction"
      : "https://www.paynow.co.zw/interface/remotetransaction";

  const res = await axios.post(
    endpoint,
    new URLSearchParams({ ...fields, hash }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  const data = Object.fromEntries(new URLSearchParams(res.data as string));
  if (data["status"] !== "Ok") throw new Error(`Paynow error: ${data["error"] ?? "Unknown"}`);

  return { pollUrl: data["pollurl"]!, redirectUrl: data["browserurl"] ?? "" };
}

export async function pollPayment(pollUrl: string): Promise<{
  status: "PAID" | "PENDING" | "FAILED" | "CANCELLED";
  paynowRef?: string;
}> {
  const res = await axios.post(pollUrl);
  const data = Object.fromEntries(new URLSearchParams(res.data as string));
  if (data["status"] === "Paid") return { status: "PAID", paynowRef: data["paynowreference"] };
  if (data["status"] === "Cancelled") return { status: "CANCELLED" };
  if (data["status"] === "Failed") return { status: "FAILED" };
  return { status: "PENDING" };
}
