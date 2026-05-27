"use client";
import { useEffect, useState } from "react";
import { api, SubscriptionRecord } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:    "badge-green",
  TRIAL:     "badge-blue",
  EXPIRED:   "badge-red",
  CANCELLED: "badge-gray",
};

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

const AVATAR_COLORS = ["#4f7cff","#34d399","#fbbf24","#a78bfa","#22d3ee","#fb923c","#f87171"];
function avatarColor(name: string) { return AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const c = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${c}18`, border: `1px solid ${c}35`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, color: c,
    }}>
      {initials(name)}
    </div>
  );
}

export default function SubscriptionsPage() {
  const [subs, setSubs]   = useState<SubscriptionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage]   = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<SubscriptionRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<SubscriptionStatus>("ACTIVE");
  const [overridePeriodEnd, setOverridePeriodEnd] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
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
    setOverridePeriodEnd(sub.currentPeriodEnd ? sub.currentPeriodEnd.slice(0, 10) : "");
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

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="page-wrap">
      <div className="page-header">
        <p className="page-eyebrow">Platform</p>
        <h1 className="page-title">Subscriptions</h1>
      </div>

      <div className="toolbar">
        <select className="tw-select" style={{ width: "auto" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tw-card">
        <table className="tw-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Period End</th>
              <th>Payments</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 20px", color: "var(--color-text-muted)", fontSize: 14 }}>Loading…</td></tr>
            ) : subs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h3M13 15h5"/>
                  </svg>
                  <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>No subscriptions found</span>
                </div>
              </td></tr>
            ) : subs.map((s) => (
              <tr key={s.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={s.driver.user.name} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{s.driver.user.name}</div>
                      <div className="num" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{s.driver.user.phone}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-gray">{s.plan}</span></td>
                <td><span className={`badge ${STATUS_BADGE[s.status] ?? "badge-gray"}`}>{s.status}</span></td>
                <td className="num" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {new Date(s.currentPeriodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {s.payments.slice(0, 3).map((p, i) => (
                      <div
                        key={i}
                        title={`$${p.amount} — ${p.status}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: p.status === "PAID" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                          border: `1px solid ${p.status === "PAID" ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
                          borderRadius: 6,
                          padding: "3px 7px",
                        }}
                      >
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: p.status === "PAID" ? "#34d399" : "#f87171", flexShrink: 0 }} />
                        <span className="num" style={{ fontSize: 11, fontWeight: 600, color: p.status === "PAID" ? "#34d399" : "#f87171" }}>${p.amount}</span>
                      </div>
                    ))}
                    {s.payments.length === 0 && <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>None</span>}
                  </div>
                </td>
                <td className="text-right">
                  <button className="btn btn-ghost btn-sm" onClick={() => openOverride(s)}>Override</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="num" style={{ fontSize: 13 }}>{total.toLocaleString()} subscriptions — page {page} of {pages}</span>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1}    onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {modal && (
        <div className="overlay">
          <div className="dialog">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar name={modal.driver.user.name} size={44} />
              <div>
                <h3 className="dialog-title">Override subscription</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 3 }}>
                  {modal.driver.user.name} · <span className="num">{modal.driver.user.phone}</span> · {modal.plan} plan
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="field-label">New Status</label>
                <select className="tw-select" value={overrideStatus} onChange={(e) => setOverrideStatus(e.target.value as SubscriptionStatus)}>
                  <option value="TRIAL">Trial</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Period end date <span style={{ fontWeight: 400, color: "var(--color-text-muted)", textTransform: "none" }}>(optional)</span></label>
                <input type="date" className="tw-input num" value={overridePeriodEnd} onChange={(e) => setOverridePeriodEnd(e.target.value)} />
              </div>
              {overrideStatus !== modal.status && (
                <div className="warn-banner">
                  <span>⚠</span>
                  <span>Status will change from <strong>{modal.status}</strong> → <strong>{overrideStatus}</strong></span>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={doOverride}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : "Apply Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
