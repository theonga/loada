"use client";
import { useEffect, useState, useRef } from "react";
import { api, ConfigEntry } from "@/lib/api";

type ConfigMap = Record<string, ConfigEntry>;

const GROUP_ORDER = ["pricing", "bidding", "matching", "auth", "payments", "market"];

const GROUP_META: Record<string, { label: string; description: string; accent: string; icon: React.ReactNode }> = {
  pricing: {
    label: "Pricing",
    description: "Subscription plan rates and fee structure",
    accent: "#F5A623",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v1.5M10 12.5V14M7.5 8.5c0-1.1.9-2 2.5-2s2.5.9 2.5 2-1.1 2-2.5 2-2.5.9-2.5 2 1 2 2.5 2 2.5-.9 2.5-2" />
      </svg>
    ),
  },
  bidding: {
    label: "Bidding",
    description: "Bid TTL, expiry windows, and counter-offer limits",
    accent: "#4f7cff",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 2l2 6h6l-5 3.5 2 6L10 14l-5 3.5 2-6L2 8h6z" />
      </svg>
    ),
  },
  matching: {
    label: "Matching",
    description: "Search radius, expansion intervals, and driver filters",
    accent: "#a78bfa",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" />
      </svg>
    ),
  },
  auth: {
    label: "Authentication",
    description: "OTP expiry, rate limits, and JWT session durations",
    accent: "#34d399",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="9" width="12" height="9" rx="2" />
        <path d="M7 9V6a3 3 0 016 0v3" />
        <circle cx="10" cy="14" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  payments: {
    label: "Payments",
    description: "Paynow polling intervals and payment retry windows",
    accent: "#22d3ee",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="16" height="12" rx="2" />
        <path d="M2 9h16" />
        <path d="M6 13h2M10 13h4" />
      </svg>
    ),
  },
  market: {
    label: "Market Reference",
    description: "Reference price ranges displayed to shippers during job posting",
    accent: "#fb923c",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="2,14 7,9 11,13 18,6" />
        <polyline points="14,6 18,6 18,10" />
      </svg>
    ),
  },
};

export default function ConfigPage() {
  const [config, setConfig] = useState<ConfigMap | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    api.getConfig()
      .then((d) => setConfig(d.config))
      .catch((e) => setError((e as Error).message));
  }, []);

  function startEdit(key: string, current: string) {
    setEditing((prev) => ({ ...prev, [key]: current }));
  }

  async function save(key: string) {
    const value = editing[key];
    if (value === undefined) return;
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await api.patchConfig({ [key]: value });
      setConfig((prev) => prev
        ? { ...prev, [key]: { ...prev[key], value, updatedAt: new Date().toISOString(), updatedBy: "you" } }
        : prev
      );
      setEditing((prev) => { const n = { ...prev }; delete n[key]; return n; });
      setSaved((prev) => ({ ...prev, [key]: true }));
      clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => {
        setSaved((prev) => { const n = { ...prev }; delete n[key]; return n; });
      }, 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving((prev) => { const n = { ...prev }; delete n[key]; return n; });
    }
  }

  function cancel(key: string) {
    setEditing((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }

  if (error) return (
    <div className="page-wrap">
      <div className="error-banner">{error}</div>
    </div>
  );

  if (!config) return (
    <div className="page-wrap">
      <div style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Loading configuration…</div>
    </div>
  );

  const byGroup: Record<string, Array<[string, ConfigEntry]>> = {};
  for (const entry of Object.entries(config)) {
    const g = entry[1].group;
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(entry);
  }

  return (
    <div className="page-wrap">
      <div className="page-header">
        <p className="page-eyebrow">Platform</p>
        <h1 className="page-title">Configuration</h1>
        <p className="page-subtitle">Changes take effect within 60 seconds (Redis cache TTL).</p>
      </div>

      <div className="flex flex-col gap-5">
        {GROUP_ORDER.filter((g) => byGroup[g]).map((group) => {
          const meta = GROUP_META[group] ?? { label: group, description: "", accent: "#8b92a5", icon: null };
          return (
            <section key={group} style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 16,
              overflow: "hidden",
            }}>
              {/* Group header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "18px 24px",
                borderBottom: "1px solid var(--color-border)",
                background: `linear-gradient(135deg, ${meta.accent}08 0%, transparent 60%)`,
              }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: `${meta.accent}18`,
                  border: `1px solid ${meta.accent}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: meta.accent,
                  flexShrink: 0,
                }}>
                  {meta.icon}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
                    {meta.label}
                  </div>
                  {meta.description && (
                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>
                      {meta.description}
                    </div>
                  )}
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase" as const,
                    color: meta.accent,
                    background: `${meta.accent}14`,
                    border: `1px solid ${meta.accent}28`,
                    borderRadius: 6,
                    padding: "3px 8px",
                  }}>
                    {byGroup[group].length} {byGroup[group].length === 1 ? "key" : "keys"}
                  </span>
                </div>
              </div>

              {/* Setting rows */}
              <div>
                {byGroup[group].map(([key, entry], idx) => {
                  const isEditing = key in editing;
                  const isSaving = saving[key];
                  const wasSaved = saved[key];
                  const isLast = idx === byGroup[group].length - 1;
                  return (
                    <div key={key} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 24px",
                      borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                      transition: "background 0.15s",
                    }}>
                      {/* Label + key */}
                      <div style={{ flex: "0 0 38%", minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.4 }}>
                          {entry.label}
                        </div>
                        <div style={{
                          fontFamily: "DM Mono, ui-monospace, monospace",
                          fontSize: 11,
                          color: "var(--color-text-muted)",
                          marginTop: 3,
                          letterSpacing: "0.02em",
                        }}>
                          {key}
                        </div>
                      </div>

                      {/* Value */}
                      <div style={{ flex: "0 0 26%", minWidth: 0 }}>
                        {isEditing ? (
                          <input
                            className="tw-input"
                            style={{ width: "100%", fontSize: 14 }}
                            value={editing[key]}
                            onChange={(e) => setEditing((p) => ({ ...p, [key]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") save(key);
                              if (e.key === "Escape") cancel(key);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span style={{
                            fontFamily: "DM Mono, ui-monospace, monospace",
                            fontSize: 22,
                            fontWeight: 700,
                            color: meta.accent,
                            letterSpacing: "-0.02em",
                            fontVariantNumeric: "tabular-nums",
                          }}>
                            {entry.value}
                          </span>
                        )}
                      </div>

                      {/* Last updated */}
                      <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                        {entry.updatedAt ? (
                          <div>
                            <div style={{
                              fontFamily: "DM Mono, ui-monospace, monospace",
                              fontSize: 12,
                              color: "var(--color-text-secondary)",
                              fontVariantNumeric: "tabular-nums",
                            }}>
                              {new Date(entry.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                              by {entry.updatedBy ?? "—"}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic" }}>
                            default
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ flexShrink: 0 }}>
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button className="btn btn-primary btn-sm" onClick={() => save(key)} disabled={isSaving}>
                                {isSaving ? (
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Saving
                                  </span>
                                ) : "Save"}
                              </button>
                              <button className="btn btn-ghost btn-sm" onClick={() => cancel(key)}>Cancel</button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(key, entry.value)}
                              style={{
                                height: 34,
                                padding: "0 14px",
                                borderRadius: 8,
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: "pointer",
                                border: wasSaved
                                  ? "1px solid rgba(52,211,153,0.35)"
                                  : "1px solid var(--color-border)",
                                background: wasSaved
                                  ? "rgba(52,211,153,0.10)"
                                  : "var(--color-surface-raised)",
                                color: wasSaved
                                  ? "#34d399"
                                  : "var(--color-text-secondary)",
                                transition: "all 0.15s",
                              }}
                            >
                              {wasSaved ? "✓ Saved" : "Edit"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
