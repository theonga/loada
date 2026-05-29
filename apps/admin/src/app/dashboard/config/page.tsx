"use client";
import { useEffect, useState, useRef } from "react";
import { api, ConfigEntry } from "@/lib/api";
import { PageHead } from "@/components/ui";

type ConfigMap = Record<string, ConfigEntry>;

// Display order — matches the design's grouping
const GROUP_ORDER = ["pricing", "bidding", "matching", "auth", "payments", "market"];

// Per-group accent class (sets border-left color via .config-card.<accent>)
// plus the icon glyph and the title.
const GROUP_META: Record<string, {
  label: string;
  accent: "amber" | "blue" | "cyan" | "purple" | "green" | "orange";
  bg: string;
  fg: string;
  icon: React.ReactNode;
}> = {
  pricing: {
    label: "Pricing",
    accent: "amber",
    bg: "rgba(245,166,35,0.14)",
    fg: "var(--color-amber)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="3" x2="12" y2="21" />
        <path d="M17 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7" />
      </svg>
    ),
  },
  bidding: {
    label: "Bidding",
    accent: "blue",
    bg: "rgba(79,124,255,0.14)",
    fg: "var(--color-accent)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 4l6 6" />
        <path d="M11 7l6 6" />
        <path d="m8 10 6 6" />
        <path d="M4 21h10" />
        <path d="M3 15l6 6" />
      </svg>
    ),
  },
  matching: {
    label: "Matching",
    accent: "cyan",
    bg: "rgba(34,211,238,0.14)",
    fg: "var(--color-cyan)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 12L19 6" />
      </svg>
    ),
  },
  auth: {
    label: "Authentication",
    accent: "purple",
    bg: "rgba(167,139,250,0.14)",
    fg: "var(--color-purple)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6z" />
      </svg>
    ),
  },
  payments: {
    label: "Payments",
    accent: "green",
    bg: "rgba(52,211,153,0.14)",
    fg: "var(--color-success)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  market: {
    label: "Market Reference",
    accent: "orange",
    bg: "rgba(251,146,60,0.14)",
    fg: "var(--color-orange)",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v16" />
        <path d="M5 20h14" />
        <path d="m4 10 4-6 4 6" />
        <path d="m12 10 4-6 4 6" />
      </svg>
    ),
  },
};

export default function ConfigPage() {
  const [config,  setConfig]  = useState<ConfigMap | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState<Record<string, boolean>>({});
  const [saved,   setSaved]   = useState<Record<string, boolean>>({});
  const [error,   setError]   = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    api.getConfig()
      .then((d) => setConfig(d.config))
      .catch((e) => setError((e as Error).message));
  }, []);

  function startEdit(key: string, current: string) {
    setEditing((p) => ({ ...p, [key]: current }));
  }

  function cancelEdit(key: string) {
    setEditing((p) => { const n = { ...p }; delete n[key]; return n; });
  }

  async function save(key: string) {
    const v = editing[key];
    if (v === undefined) return;
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      await api.patchConfig({ [key]: v });
      setConfig((prev) => prev
        ? { ...prev, [key]: { ...prev[key], value: v, updatedAt: new Date().toISOString(), updatedBy: "you" } }
        : prev,
      );
      cancelEdit(key);
      setSaved((p) => ({ ...p, [key]: true }));
      clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => {
        setSaved((p) => { const n = { ...p }; delete n[key]; return n; });
      }, 1600);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving((p) => { const n = { ...p }; delete n[key]; return n; });
    }
  }

  if (error && !config) {
    return (
      <div>
        <PageHead eyebrow="Platform" title="Configuration" />
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <PageHead eyebrow="Platform" title="Configuration" />
        <div style={{ color: "var(--color-text-secondary)" }}>Loading configuration…</div>
      </div>
    );
  }

  // Group entries
  const byGroup: Record<string, Array<[string, ConfigEntry]>> = {};
  for (const entry of Object.entries(config)) {
    const g = entry[1].group;
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(entry);
  }

  return (
    <div>
      <PageHead
        eyebrow="Platform"
        title="Configuration"
        sub="Live operational settings — changes take effect immediately"
      />

      <div className="config-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
        <div className="body">
          <strong>Live settings.</strong> Changes are applied in real time. Redis cache clears within 60 seconds.
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="config-grid">
        {GROUP_ORDER.filter((g) => byGroup[g]).map((groupId) => {
          const meta = GROUP_META[groupId];
          const items = byGroup[groupId];
          return (
            <div key={groupId} className={`config-card ${meta.accent}`}>
              <div className="config-head">
                <div className="ico" style={{ background: meta.bg, color: meta.fg }}>
                  {meta.icon}
                </div>
                <div className="title">{meta.label}</div>
                <div className="count">{items.length} keys</div>
              </div>
              <div className="config-body">
                {items.map(([key, entry]) => {
                  const isEditing = key in editing;
                  const isSaving  = saving[key];
                  const wasSaved  = saved[key];

                  return (
                    <div key={key} className={`row${isEditing ? " editing" : ""}`}>
                      <div className="k">{entry.label}</div>

                      {!isEditing && (
                        <div
                          className="v mono"
                          role="button"
                          tabIndex={0}
                          onClick={() => startEdit(key, entry.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") startEdit(key, entry.value); }}
                          title="Click to edit"
                        >
                          {entry.value}
                        </div>
                      )}

                      {isEditing && (
                        <>
                          <input
                            className="edit-input"
                            value={editing[key]}
                            onChange={(e) => setEditing((p) => ({ ...p, [key]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")  save(key);
                              if (e.key === "Escape") cancelEdit(key);
                            }}
                            autoFocus
                          />
                          <div className="edit-actions">
                            <button className="btn ghost sm" onClick={() => cancelEdit(key)}>Cancel</button>
                            <button className="btn primary sm" onClick={() => save(key)} disabled={isSaving}>
                              {isSaving ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </>
                      )}

                      {!isEditing && wasSaved && (
                        <span className="saved">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="5 12 10 17 19 7" />
                          </svg>
                          Saved
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
