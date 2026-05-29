import { describe, it, expect } from "vitest";
import { moderateChatMessage } from "./chat-moderation";

describe("moderateChatMessage", () => {
  it("passes a clean message through with no flagged reasons", () => {
    const r = moderateChatMessage("On my way, ETA 20 minutes.");
    expect(r.flaggedReason).toBeNull();
  });

  it("flags a Zimbabwe local phone number (no separators)", () => {
    const r = moderateChatMessage("Call me on 0773057669");
    expect(r.flaggedReason).not.toBeNull();
  });

  it("flags a Zimbabwe local phone number (077 305 7669 format)", () => {
    const r = moderateChatMessage("Call me on 077 305 7669");
    expect(r.flaggedReason).not.toBeNull();
  });

  it("flags an international phone number", () => {
    const r = moderateChatMessage("My number is +263 77 305 7669");
    expect(r.flaggedReason).not.toBeNull();
  });

  it("flags WhatsApp handles", () => {
    const r = moderateChatMessage("DM me on whatsapp instead");
    expect(r.flaggedReason).not.toBeNull();
  });

  it("flags collusion phrases", () => {
    const r = moderateChatMessage("Let's settle this off-platform — cash only");
    expect(r.flaggedReason).not.toBeNull();
  });

  it("flags email addresses", () => {
    const r = moderateChatMessage("Email me at driver@example.com");
    expect(r.flaggedReason).not.toBeNull();
  });

  it("tolerates null / undefined / empty input", () => {
    expect(moderateChatMessage(null).flaggedReason).toBeNull();
    expect(moderateChatMessage(undefined).flaggedReason).toBeNull();
    expect(moderateChatMessage("").flaggedReason).toBeNull();
  });
});
