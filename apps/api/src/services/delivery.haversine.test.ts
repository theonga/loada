import { describe, it, expect } from "vitest";
import { haversineKm } from "./delivery.service";

// Anchor points used in seed data.
const HARARE = { lat: -17.8292, lng: 31.0522 };
const BULAWAYO = { lat: -20.1325, lng: 28.6253 };

describe("haversineKm", () => {
  it("returns ~0 for the same point", () => {
    const d = haversineKm(HARARE.lat, HARARE.lng, HARARE.lat, HARARE.lng);
    expect(d).toBeCloseTo(0, 5);
  });

  it("returns Harare↔Bulawayo distance within ±5 km of the true ~365 km", () => {
    const d = haversineKm(HARARE.lat, HARARE.lng, BULAWAYO.lat, BULAWAYO.lng);
    expect(d).toBeGreaterThan(360);
    expect(d).toBeLessThan(370);
  });

  it("is symmetric", () => {
    const ab = haversineKm(HARARE.lat, HARARE.lng, BULAWAYO.lat, BULAWAYO.lng);
    const ba = haversineKm(BULAWAYO.lat, BULAWAYO.lng, HARARE.lat, HARARE.lng);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it("returns sub-km distance for a 500 m delta (GPS gate boundary)", () => {
    // 500m north of Harare. 1 deg lat ≈ 111 km, so 500 m ≈ 0.0045 deg.
    const d = haversineKm(HARARE.lat, HARARE.lng, HARARE.lat + 0.0045, HARARE.lng);
    expect(d).toBeGreaterThan(0.4);
    expect(d).toBeLessThan(0.55);
  });

  it("clearly exceeds tolerance when 5 km away", () => {
    // ~5 km east of Harare. 1 deg lng at -17.8° ≈ 105.8 km, so 5 km ≈ 0.0473 deg.
    const d = haversineKm(HARARE.lat, HARARE.lng, HARARE.lat, HARARE.lng + 0.0473);
    expect(d).toBeGreaterThan(4.5);
    expect(d).toBeLessThan(5.5);
  });
});
