import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyResponseHash } from "./paynow";

const KEY = "test-integration-key-1234567890";

function buildHash(fields: Record<string, string>): string {
  return crypto
    .createHash("sha512")
    .update(Object.values(fields).join("") + KEY)
    .digest("hex")
    .toUpperCase();
}

describe("verifyResponseHash", () => {
  it("accepts a correctly hashed response", () => {
    const fields = {
      reference: "TX-001",
      paynowreference: "PNR-123",
      amount: "10.00",
      status: "Paid",
    };
    const hash = buildHash(fields);
    expect(verifyResponseHash(fields, hash, KEY)).toBe(true);
  });

  it("accepts a lowercase hash (Paynow occasionally returns lower-case)", () => {
    const fields = { reference: "TX-002", amount: "20.00", status: "Paid" };
    const hash = buildHash(fields).toLowerCase();
    expect(verifyResponseHash(fields, hash, KEY)).toBe(true);
  });

  it("rejects a tampered amount", () => {
    const fields = { reference: "TX-003", amount: "5.00", status: "Paid" };
    const hash = buildHash(fields);
    const tampered = { ...fields, amount: "500.00" };
    expect(verifyResponseHash(tampered, hash, KEY)).toBe(false);
  });

  it("rejects a tampered status", () => {
    const fields = { reference: "TX-004", amount: "30.00", status: "Cancelled" };
    const hash = buildHash(fields);
    const tampered = { ...fields, status: "Paid" };
    expect(verifyResponseHash(tampered, hash, KEY)).toBe(false);
  });

  it("rejects when the integration key is wrong", () => {
    const fields = { reference: "TX-005", amount: "40.00", status: "Paid" };
    const hash = buildHash(fields);
    expect(verifyResponseHash(fields, hash, "different-key")).toBe(false);
  });

  it("is sensitive to field order (order changes the underlying value string)", () => {
    const original = { a: "1", b: "2", c: "3" };
    const reordered = { c: "3", b: "2", a: "1" };
    const hash = buildHash(original);
    expect(verifyResponseHash(reordered, hash, KEY)).toBe(false);
  });
});
