"use client";
import { useEffect, useState, useRef } from "react";
import { api, ConfigEntry } from "@/lib/api";
import styles from "./config.module.css";

type ConfigMap = Record<string, ConfigEntry>;

const GROUP_ORDER = ["pricing", "bidding", "matching", "auth", "payments", "market"];
const GROUP_LABELS: Record<string, string> = {
  pricing:  "Pricing",
  bidding:  "Bidding",
  matching: "Matching",
  auth:     "Authentication",
  payments: "Payments",
  market:   "Market Reference",
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

  if (error) return <div className="card" style={{ padding: 16, color: "var(--red)" }}>{error}</div>;
  if (!config) return <div className={styles.loading}>Loading config…</div>;

  const byGroup: Record<string, Array<[string, ConfigEntry]>> = {};
  for (const entry of Object.entries(config)) {
    const g = entry[1].group;
    if (!byGroup[g]) byGroup[g] = [];
    byGroup[g].push(entry);
  }

  return (
    <div>
      <h1 className={styles.heading}>Config</h1>
      <p className={styles.sub}>Changes take effect within 60 seconds (Redis cache TTL).</p>

      {GROUP_ORDER.filter((g) => byGroup[g]).map((group) => (
        <section key={group} className={styles.section}>
          <h2 className={styles.groupLabel}>{GROUP_LABELS[group] ?? group}</h2>
          <div className="card">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Setting</th>
                  <th style={{ width: "20%" }}>Value</th>
                  <th style={{ width: "25%" }}>Last updated</th>
                  <th style={{ width: "15%" }}></th>
                </tr>
              </thead>
              <tbody>
                {byGroup[group].map(([key, entry]) => {
                  const isEditing = key in editing;
                  const isSaving = saving[key];
                  const wasSaved = saved[key];
                  return (
                    <tr key={key}>
                      <td>
                        <div className={styles.label}>{entry.label}</div>
                        <div className={styles.key}>{key}</div>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            className={`input ${styles.valueInput}`}
                            value={editing[key]}
                            onChange={(e) => setEditing((p) => ({ ...p, [key]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") save(key);
                              if (e.key === "Escape") cancel(key);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className={styles.value}>{entry.value}</span>
                        )}
                      </td>
                      <td className={styles.meta}>
                        {entry.updatedAt
                          ? `${new Date(entry.updatedAt).toLocaleDateString()} by ${entry.updatedBy ?? "—"}`
                          : <span style={{ color: "var(--text-2)" }}>default</span>}
                      </td>
                      <td>
                        <div className={styles.actions}>
                          {isEditing ? (
                            <>
                              <button
                                className="btn btn-primary"
                                style={{ padding: "4px 10px", fontSize: 12 }}
                                onClick={() => save(key)}
                                disabled={isSaving}
                              >
                                {isSaving ? "…" : "Save"}
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: "4px 10px", fontSize: 12 }}
                                onClick={() => cancel(key)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className={`btn btn-ghost ${wasSaved ? styles.savedBtn : ""}`}
                              style={{ padding: "4px 10px", fontSize: 12 }}
                              onClick={() => startEdit(key, entry.value)}
                            >
                              {wasSaved ? "✓ Saved" : "Edit"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
