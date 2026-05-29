import axios from "axios";
import crypto from "crypto";

export type PaynowMethod = "ecocash" | "onemoney" | "vmc";

function sha512(input: string): string {
  return crypto.createHash("sha512").update(input).digest("hex").toUpperCase();
}

// Hash = SHA512(all field values concatenated in order + integration key)
function generateHash(fields: Record<string, string>, integrationKey: string): string {
  return sha512(Object.values(fields).join("") + integrationKey);
}

// Verify a hash from a Paynow response. Pass all fields EXCEPT the hash itself,
// in the order they were received.
export function verifyResponseHash(
  fields: Record<string, string>,
  receivedHash: string,
  integrationKey: string,
): boolean {
  return sha512(Object.values(fields).join("") + integrationKey) === receivedHash.toUpperCase();
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

  // Field order MUST match Paynow's expected hash sequence for express checkout:
  // id → reference → amount → additionalinfo → returnurl → resulturl → status → authemail → phone → method
  const fields: Record<string, string> = {
    id:             process.env.PAYNOW_INTEGRATION_ID!,
    reference,
    amount:         amount.toFixed(2),
    additionalinfo: description,
    returnurl:      `${process.env.API_BASE_URL ?? "https://api.loada.app"}/v1/payments/return`,
    resulturl:      `${process.env.API_BASE_URL ?? "https://api.loada.app"}/v1/payments/result`,
    status:         "Message",
    authemail:      email,
    phone,
    method,
  };

  const hash = generateHash(fields, process.env.PAYNOW_INTEGRATION_KEY!);

  const res = await axios.post(
    "https://www.paynow.co.zw/interface/remotetransaction",
    new URLSearchParams({ ...fields, hash }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );

  const data = Object.fromEntries(new URLSearchParams(res.data as string));
  if (data["status"] !== "Ok") {
    throw new Error(data["error"] ?? "Paynow initiation failed");
  }

  return { pollUrl: data["pollurl"]!, redirectUrl: data["browserurl"] ?? "" };
}

export async function pollPayment(pollUrl: string): Promise<{
  status: "PAID" | "PENDING" | "FAILED" | "CANCELLED";
  paynowRef?: string;
  amount?: number;
}> {
  // Paynow poll endpoint is a GET request
  const res = await axios.get<string>(pollUrl);
  const parsed = new URLSearchParams(res.data);
  const data = Object.fromEntries(parsed);

  const { hash, ...fields } = data;

  if (hash) {
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY!;
    if (!verifyResponseHash(fields, hash, integrationKey)) {
      throw new Error("Paynow poll response hash verification failed");
    }
  }

  const status = data["status"];
  if (status === "Paid" || status === "Awaiting Delivery" || status === "Delivered") {
    return {
      status:    "PAID",
      paynowRef: data["paynowreference"],
      amount:    parseFloat(data["amount"] ?? "0"),
    };
  }
  if (status === "Cancelled") return { status: "CANCELLED" };
  if (status === "Failed" || status === "Error") return { status: "FAILED" };
  return { status: "PENDING" };
}
