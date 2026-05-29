/**
 * Lightweight pattern matcher for chat messages that look like off-platform
 * negotiation attempts — phone numbers, alternate contact handles, suggestions
 * to settle in cash outside the wallet flow.
 *
 * The goal is NOT to block these messages (legitimate ones exist — e.g. "the
 * recipient's number is +263..."). Instead we attach a `flaggedReason` string
 * so the admin audit feed can review and act. Loada uses cash-on-delivery
 * payment by design, so a hard block here would cause too many false positives.
 */

export interface ChatModerationResult {
  flaggedReason: string | null;
  matches: string[];
}

// Zimbabwe local mobile pattern (e.g. 0771234567), international +263 form,
// and any 8+ contiguous digits. We deliberately allow 6–7 digit sequences
// through since they often appear in tracking codes and order numbers.
const PHONE_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "phone:zw-international", re: /\+?263\s*[\-\.\s]?[7-9]\d[\s\-\.]?\d{3}[\s\-\.]?\d{3,4}/i },
  { name: "phone:zw-local",         re: /\b0[7-9]\d[\s\-\.]?\d{3}[\s\-\.]?\d{3,4}\b/ },
  { name: "phone:long-digits",      re: /\b\d{8,}\b/ },
];

const HANDLE_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "contact:whatsapp", re: /\b(whatsapp|wa\.me|whats\s*app|whtsap)\b/i },
  { name: "contact:telegram", re: /\b(telegram|t\.me\/)\b/i },
  { name: "contact:email",    re: /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i },
];

const COLLUSION_PATTERNS: { name: string; re: RegExp }[] = [
  // "outside the app", "off platform", "off-app", "off platform"
  { name: "collusion:off-platform", re: /\b(off[\s\-]?(platform|app|loada)|outside\s+(the\s+)?(app|loada|platform|system))\b/i },
  // "skip the app", "not through loada", "avoid the fee/commission"
  { name: "collusion:avoid-fee", re: /\b(skip|avoid|bypass|dodge|escape|forget)\s+(the\s+)?(app|loada|platform|fee|commission|charge)/i },
  // "cancel and re-post directly", "cancel the bid and i'll pay you"
  { name: "collusion:cancel-direct", re: /\bcancel\s+(the\s+)?(bid|job|booking|load).{0,40}(direct|cash|outside|me directly|pay you)/i },
  // "pay me cash", "cash only", "outside the platform"
  { name: "collusion:cash-only", re: /\b(pay\s+me\s+)?cash\s+(only|outside|directly|on\s+(hand|delivery))/i },
];

/**
 * Scan an outgoing message and produce a moderation verdict. Returns
 * `flaggedReason = null` when nothing fires. Patterns are intentionally lossy —
 * we'd rather catch borderline cases and let the admin triage than miss them.
 */
export function moderateChatMessage(content: string | null | undefined): ChatModerationResult {
  if (!content) return { flaggedReason: null, matches: [] };

  const text = content.normalize("NFKC");
  const matches: string[] = [];

  for (const group of [PHONE_PATTERNS, HANDLE_PATTERNS, COLLUSION_PATTERNS]) {
    for (const { name, re } of group) {
      if (re.test(text)) matches.push(name);
    }
  }

  return {
    flaggedReason: matches.length ? matches.join(",") : null,
    matches,
  };
}
