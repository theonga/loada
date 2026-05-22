"use client";
import { useEffect, useState } from "react";
import { api, SubscriptionRecord } from "@/lib/api";
import styles from "./subscriptions.module.css";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:    "badge-green",
  TRIAL:     "badge-blue",
  EXPIRED:   "badge-red",
  CANCELLED: "badge-gray",
};

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<SubscriptionRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<SubscriptionStatus>("ACTIVE");
  const [overridePeriodEnd, setOverridePeriodEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 50;

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (statusFilter) params.status = statusFilter;
      const d = await api.getSubscriptions(params);
      setSubs(d.subscriptions);
      setTotal(d.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  function openOverride(sub: SubscriptionRecord) {
    setModal(sub);
    setOverrideStatus(sub.status as SubscriptionStatus);
    const end = sub.currentPeriodEnd ? sub.currentPeriodEnd.slice(0, 10) : "";
    setOverridePeriodEnd(end);
  }

  async function doOverride() {
    if (!modal) return;
    setSaving(true);
    try {
      const body: { status: string; currentPeriodEnd?: string } = { status: overrideStatus };
      if (overridePeriodEnd) body.currentPeriodEnd = new Date(overridePeriodEnd).toISOString();
      await api.overrideSubscription(modal.id, body);
      setSubs((prev) => prev.map((s) => s.id === modal.id
        ? { ...s, status: overrideStatus, currentPeriodEnd: overridePeriodEnd ? new Date(overridePeriodEnd).toISOString() : s.currentPeriodEnd }
        : s));
      setModal(null);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <h1 className={styles.heading}>Subscriptions</h1>

      <div className={styles.toolbar}>
        <select className="select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && <div style={{ color: "var(--red)", marginBottom: 12 }}>{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Period End</th>
              <th>Last Payments</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ color: "var(--text-2)", padding: 24 }}>Loading…</td></tr>
            ) : subs.map((s) => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{s.driver.user.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "monospace" }}>{s.driver.user.phone}</div>
                </td>
                <td><span className="badge badge-gray">{s.plan}</span></td>
                <td><span className={`badge ${STATUS_BADGE[s.status] ?? "badge-gray"}`}>{s.status}</span></td>
                <td style={{ fontSize: 13, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
                  {new Date(s.currentPeriodEnd).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {s.payments.slice(0, 3).map((p, i) => (
                      <span key={i} className={`badge ${p.status === "PAID" ? "badge-green" : "badge-red"}`}
                        style={{ fontSize: 10 }}>
                        ${p.amount}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}
                    onClick={() => openOverride(s)}>
                    Override
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span style={{ color: "var(--text-2)", fontSize: 13 }}>
          {total} subscriptions · page {page} of {Math.max(1, Math.ceil(total / LIMIT))}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost" disabled={page * LIMIT >= total} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {modal && (
        <div className={styles.overlay}>
          <div className={`card ${styles.dialog}`}>
            <h3 className={styles.dialogTitle}>Override — {modal.driver.user.name}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className={styles.field}>
                <label>Status</label>
                <select className="select" value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as SubscriptionStatus)}>
                  <option value="TRIAL">TRIAL</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="EXPIRED">EXPIRED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Period end date (optional)</label>
                <input type="date" className="input" value={overridePeriodEnd}
                  onChange={(e) => setOverridePeriodEnd(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={doOverride}>
                {saving ? "Saving…" : "Apply Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
