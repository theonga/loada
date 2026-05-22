import axios from "axios";
import crypto from "crypto";

function generateHash(values: string[], integrationKey: string): string {
  const str = values.join("") + integrationKey;
  return crypto.createHash("sha512").update(str).digest("hex").toUpperCase();
}

export async function initiatePayment(params: {
  reference: string;
  amount: number;
  phone: string;
  description: string;
}): Promise<{ pollUrl: string; redirectUrl: string }> {
  const fields = {
    id: process.env.PAYNOW_INTEGRATION_ID!,
    reference: params.reference,
    amount: params.amount.toFixed(2),
    additionalinfo: params.description,
    authemail: "",
    phone: params.phone,
    method: "ecocash",
    returnurl: "https://loada.app/payment/return",
    resulturl: "https://loada.app/payment/result",
    status: "Message",
  };
  const hash = generateHash(Object.values(fields), process.env.PAYNOW_INTEGRATION_KEY!);
  const res = await axios.post(
    "https://www.paynow.co.zw/interface/remotetransaction",
    new URLSearchParams({ ...fields, hash }).toString(),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  const data = Object.fromEntries(new URLSearchParams(res.data as string));
  if (data["status"] !== "Ok") throw new Error(`Paynow error: ${data["error"]}`);
  return { pollUrl: data["pollurl"]!, redirectUrl: data["browserurl"]! };
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
