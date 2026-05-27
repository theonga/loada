"use client";
import { useEffect, useState, useCallback } from "react";
import { api, DriverRecord } from "@/lib/api";

const LIMIT = 50;

const DOC_BADGE: Record<string, string> = {
  PENDING:      "badge-amber",
  UNDER_REVIEW: "badge-blue",
  APPROVED:     "badge-green",
  REJECTED:     "badge-red",
  EXPIRED:      "badge-red",
};
const SUB_BADGE: Record<string, string> = {
  ACTIVE: "badge-green", TRIAL: "badge-blue", EXPIRED: "badge-red", CANCELLED: "badge-gray",
};

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

type DocModalState = {
  driver: DriverRecord;
  rejectFlow: boolean;
  rejectReason: string;
};

export default function DriversPage() {
  const [drivers,    setDrivers]    = useState<DriverRecord[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [docStatus,  setDocStatus]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [bulkModal,  setBulkModal]  = useState<"approve" | "reject" | null>(null);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkWorking,setBulkWorking]= useState(false);
  const [docModal,   setDocModal]   = useState<DocModalState | null>(null);
  const [actionId,   setActionId]   = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (docStatus === "NEEDS_REVIEW") {
        params.documentStatus = "PENDING";
      } else if (docStatus) {
        params.documentStatus = docStatus;
      }
      const d = await api.getDrivers(params);
      // Client-side: when NEEDS_REVIEW, also include UNDER_REVIEW from same page
      if (docStatus === "NEEDS_REVIEW") {
        const d2 = await api.getDrivers({ page: String(page), limit: String(LIMIT), documentStatus: "UNDER_REVIEW" });
        const combined = [...d.drivers, ...d2.drivers];
        setDrivers(combined);
        setTotal(d.total + d2.total);
      } else {
        setDrivers(d.drivers);
        setTotal(d.total);
      }
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page, docStatus]);

  useEffect(() => { load(); }, [load]);

  const allSelected  = drivers.length > 0 && drivers.every((d) => selected.has(d.id));
  const someSelected = selected.size > 0;
  const toggleAll    = () => allSelected ? setSelected(new Set()) : setSelected(new Set(drivers.map((d) => d.id)));
  const toggleOne    = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  async function doBulk() {
    if (!bulkModal || !selected.size) return;
    if (bulkModal === "reject" && !bulkReason.trim()) return;
    setBulkWorking(true);
    try {
      const ids = [...selected];
      if (bulkModal === "approve") await api.bulkApproveDriverDocs(ids);
      if (bulkModal === "reject")  await api.bulkRejectDriverDocs(ids, bulkReason);
      await load();
      setBulkModal(null);
      setBulkReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setBulkWorking(false); }
  }

  async function approve(driverId: string) {
    setActionId(driverId);
    try {
      await api.approveDocs(driverId);
      setDrivers((prev) => prev.map((d) => d.id === driverId ? { ...d, documentStatus: "APPROVED" } : d));
      if (docModal?.driver.id === driverId) setDocModal((m) => m ? { ...m, driver: { ...m.driver, documentStatus: "APPROVED" } } : null);
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  async function doReject(driverId: string, reason: string) {
    setActionId(driverId);
    try {
      await api.rejectDocs(driverId, reason);
      setDrivers((prev) => prev.map((d) => d.id === driverId ? { ...d, documentStatus: "REJECTED" } : d));
      if (docModal?.driver.id === driverId) setDocModal((m) => m ? { ...m, driver: { ...m.driver, documentStatus: "REJECTED" }, rejectFlow: false, rejectReason: "" } : null);
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="page-wrap">
      <div className="page-header">
        <p className="page-eyebrow">Operations</p>
        <h1 className="page-title">Drivers</h1>
      </div>

      {/* Quick-filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { value: "", label: "All Drivers" },
          { value: "NEEDS_REVIEW", label: "Needs Review" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
          { value: "EXPIRED", label: "Expired" },
        ].map(({ value, label }) => {
          const active = docStatus === value;
          const isNeedsReview = value === "NEEDS_REVIEW";
          return (
            <button
              key={value}
              onClick={() => {
                setDocStatus(value === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : value);
                setPage(1);
              }}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                transition: "all 0.15s",
                borderColor: active
                  ? (isNeedsReview ? "rgba(245,166,35,0.4)" : "rgba(79,124,255,0.4)")
                  : "var(--color-border)",
                background: active
                  ? (isNeedsReview ? "rgba(245,166,35,0.10)" : "rgba(79,124,255,0.10)")
                  : "var(--color-surface-raised)",
                color: active
                  ? (isNeedsReview ? "#F5A623" : "var(--color-accent)")
                  : "var(--color-text-secondary)",
              }}
            >
              {label}
            </button>
          );
        })}
        {someSelected && (
          <div className="bulk-bar" style={{ marginLeft: "auto" }}>
            <span className="bulk-bar-count">{selected.size} selected</span>
            <div className="bulk-bar-divider" />
            <button className="btn btn-primary btn-sm" onClick={() => setBulkModal("approve")}>Approve all</button>
            <button className="btn btn-danger btn-sm"  onClick={() => setBulkModal("reject")}>Reject all</button>
          </div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tw-card">
        <table className="tw-table">
          <thead>
            <tr>
              <th style={{ width: 44, paddingRight: 0 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-[#4f7cff] cursor-pointer" />
              </th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Cap.</th>
              <th>Documents</th>
              <th>Subscription</th>
              <th>Online</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "var(--color-text-muted)", fontSize: 14 }}>Loading…</td></tr>
            ) : drivers.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="5" width="13" height="11" rx="2"/><path d="M14 9h3.5L21 13v4h-7V9z"/><circle cx="5" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>
                  </svg>
                  <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>No drivers found</span>
                </div>
              </td></tr>
            ) : drivers.map((d) => (
              <tr key={d.id} className={selected.has(d.id) ? "row-selected" : ""}>
                <td style={{ paddingRight: 0 }}>
                  <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} className="w-4 h-4 accent-[#4f7cff] cursor-pointer" />
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={d.user.name} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{d.user.name}</div>
                      <div className="num" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{d.user.phone}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{d.truckMake} {d.truckModel}{d.truckYear ? ` (${d.truckYear})` : ""}</div>
                  <div className="num" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{d.truckRegistration}</div>
                </td>
                <td>
                  <span className="badge badge-gray" style={{ fontFamily: "DM Mono, monospace" }}>{d.capacityTonnes}t</span>
                </td>
                <td>
                  <span className={`badge ${DOC_BADGE[d.documentStatus] ?? "badge-gray"}`}>{d.documentStatus.replace(/_/g, " ")}</span>
                </td>
                <td>
                  {d.subscription
                    ? <span className={`badge ${SUB_BADGE[d.subscription.status] ?? "badge-gray"}`}>{d.subscription.status}</span>
                    : <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>None</span>}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: d.isOnline ? "#34d399" : "var(--color-border)", boxShadow: d.isOnline ? "0 0 6px rgba(52,211,153,0.5)" : "none" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: d.isOnline ? "#34d399" : "var(--color-text-muted)" }}>
                      {d.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setDocModal({ driver: d, rejectFlow: false, rejectReason: "" })}
                      style={{
                        height: 34, padding: "0 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        border: "1px solid",
                        ...(["PENDING", "UNDER_REVIEW"].includes(d.documentStatus)
                          ? { background: "rgba(245,166,35,0.10)", borderColor: "rgba(245,166,35,0.35)", color: "#F5A623" }
                          : { background: "var(--color-surface-raised)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }),
                      }}
                    >
                      {["PENDING", "UNDER_REVIEW"].includes(d.documentStatus) ? "⚑ Review Docs" : "View Docs"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="num" style={{ fontSize: 13 }}>{total.toLocaleString()} drivers — page {page} of {pages}</span>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1}    onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {/* Bulk modal */}
      {bulkModal && (
        <div className="overlay">
          <div className="dialog">
            <h3 className="dialog-title">
              {bulkModal === "approve"
                ? `Approve documents for ${selected.size} driver${selected.size > 1 ? "s" : ""}`
                : `Reject documents for ${selected.size} driver${selected.size > 1 ? "s" : ""}`}
            </h3>
            {bulkModal === "approve"
              ? <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>All selected drivers will have their document status set to Approved.</p>
              : <div className="field">
                  <label className="field-label">Reason (required)</label>
                  <textarea className="tw-textarea" placeholder="Reason for rejection…" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} rows={3} />
                </div>}
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => { setBulkModal(null); setBulkReason(""); }}>Cancel</button>
              <button className={bulkModal === "approve" ? "btn btn-primary" : "btn btn-danger"} disabled={bulkWorking || (bulkModal === "reject" && !bulkReason.trim())} onClick={doBulk}>
                {bulkWorking ? "Working…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document review modal */}
      {docModal && (() => {
        const d = docModal.driver;
        const docs = [
          { label: "Driving Licence", url: d.licenceUrl, expiry: d.licenceExpiry },
          { label: "Vehicle Registration", url: d.registrationUrl, expiry: d.registrationExpiry },
          { label: "Truck Photo", url: d.truckPhotoUrl, expiry: null },
        ];
        const busy = actionId === d.id;
        return (
          <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setDocModal(null); }}>
            <div className="dialog" style={{ maxWidth: 600 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={d.user.name} size={44} />
                <div style={{ flex: 1 }}>
                  <h3 className="dialog-title">{d.user.name}</h3>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 3 }}>
                    {d.truckMake} {d.truckModel} · <span className="num">{d.truckRegistration}</span> · {d.capacityTonnes}t
                  </p>
                </div>
                <span className={`badge ${DOC_BADGE[d.documentStatus] ?? "badge-gray"}`} style={{ flexShrink: 0 }}>
                  {d.documentStatus.replace(/_/g, " ")}
                </span>
              </div>

              {/* Document cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {docs.map((doc) => (
                  <div key={doc.label} style={{
                    background: "var(--color-surface-raised)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    padding: "14px 14px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
                      {doc.label}
                    </div>
                    {doc.expiry && (
                      <div className="num" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                        Expires {new Date(doc.expiry).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    )}
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--color-accent)",
                          marginTop: "auto",
                          textDecoration: "none",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v5H2V2h5M13 2h5v5M8 12L18 2"/>
                        </svg>
                        Open
                      </a>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic", marginTop: "auto" }}>Not uploaded</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Reject reason input when in reject flow */}
              {docModal.rejectFlow && (
                <div className="field">
                  <label className="field-label">Reason for rejection (required)</label>
                  <textarea
                    className="tw-textarea"
                    placeholder="Describe what's missing or incorrect…"
                    rows={3}
                    value={docModal.rejectReason}
                    onChange={(e) => setDocModal((m) => m ? { ...m, rejectReason: e.target.value } : null)}
                    autoFocus
                  />
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                {docModal.rejectFlow ? (
                  <>
                    <button className="btn btn-ghost" onClick={() => setDocModal((m) => m ? { ...m, rejectFlow: false, rejectReason: "" } : null)}>Back</button>
                    <button className="btn btn-danger" disabled={!docModal.rejectReason.trim() || busy} onClick={() => doReject(d.id, docModal.rejectReason)}>
                      {busy ? "Rejecting…" : "Confirm Reject"}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-ghost" onClick={() => setDocModal(null)}>Close</button>
                    {d.documentStatus !== "REJECTED" && (
                      <button className="btn btn-danger btn-sm" style={{ height: 44 }} onClick={() => setDocModal((m) => m ? { ...m, rejectFlow: true } : null)}>
                        Reject Docs
                      </button>
                    )}
                    {d.documentStatus !== "APPROVED" && (
                      <button className="btn btn-primary" disabled={busy} onClick={() => approve(d.id)}>
                        {busy ? "Approving…" : "Approve Docs"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
