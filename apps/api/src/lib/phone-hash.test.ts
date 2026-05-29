import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hashPhoneLookup } from "./phone-hash";

const ORIGINAL_PEPPER = process.env.PHONE_PEPPER;

describe("hashPhoneLookup", () => {
  beforeAll(() => {
    process.env.PHONE_PEPPER = "test-pepper-1234567890abcdef";
  });
  afterAll(() => {
    if (ORIGINAL_PEPPER === undefined) delete process.env.PHONE_PEPPER;
    else process.env.PHONE_PEPPER = ORIGINAL_PEPPER;
  });

  it("is deterministic — same input gives same output", () => {
    const a = hashPhoneLookup("+263771000001");
    const b = hashPhoneLookup("+263771000001");
    expect(a).toBe(b);
  });

  it("trims whitespace so visually-identical inputs collide", () => {
    expect(hashPhoneLookup(" +263771000001 ")).toBe(hashPhoneLookup("+263771000001"));
  });

  it("produces different hashes for different phones", () => {
    expect(hashPhoneLookup("+263771000001")).not.toBe(hashPhoneLookup("+263771000002"));
  });

  it("produces different hashes when the pepper changes", () => {
    process.env.PHONE_PEPPER = "pepper-A";
    const a = hashPhoneLookup("+263771000001");
    process.env.PHONE_PEPPER = "pepper-B";
    const b = hashPhoneLookup("+263771000001");
    expect(a).not.toBe(b);
  });

  it("throws if PHONE_PEPPER is unset", () => {
    delete process.env.PHONE_PEPPER;
    expect(() => hashPhoneLookup("+263771000001")).toThrow(/PHONE_PEPPER/);
  });

  it("returns a 64-char hex digest", () => {
    process.env.PHONE_PEPPER = "test-pepper";
    const hash = hashPhoneLookup("+263771000001");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
