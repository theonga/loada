"use client";
import { useEffect, useState, useCallback } from "react";
import { api, JobRecord } from "@/lib/api";

const CANCELLABLE = new Set(["POSTED","BIDDING","RADIUS_EXPANDED","MATCHED","PICKUP_EN_ROUTE","PICKUP_ARRIVED","LOADED","IN_TRANSIT"]);

const STATUS_BADGE: Record<string, string> = {
  POSTED: "badge-amber", BIDDING: "badge-amber", RADIUS_EXPANDED: "badge-amber",
  MATCHED: "badge-blue", PICKUP_EN_ROUTE: "badge-blue", PICKUP_ARRIVED: "badge-blue",
  LOADED: "badge-blue",  IN_TRANSIT: "badge-blue",
  DELIVERED: "badge-green", COMPLETED: "badge-green",
  CANCELLED: "badge-gray",  DISPUTED: "badge-red",
};

const JOB_STATUSES = [
  "POSTED","BIDDING","RADIUS_EXPANDED","MATCHED",
  "PICKUP_EN_ROUTE","PICKUP_ARRIVED","LOADED","IN_TRANSIT",
  "DELIVERED","COMPLETED","CANCELLED","DISPUTED",
];

const LIMIT = 50;

const AVATAR_COLORS = ["#4f7cff","#34d399","#fbbf24","#a78bfa","#22d3ee","#fb923c","#f87171"];
function avatarColor(name: string) { return AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const c = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${c}18`, border: `1px solid ${c}35`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: c,
    }}>
      {initials(name)}
    </div>
  );
}

export default function JobsPage() {
  const [jobs,        setJobs]        = useState<JobRecord[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [status,      setStatus]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkModal,   setBulkModal]   = useState(false);
  const [bulkReason,  setBulkReason]  = useState("");
  const [bulkWorking, setBulkWorking] = useState(false);
  const [cancelModal,  setCancelModal]  = useState<{ jobId: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (status) params.status = status;
      const d = await api.getJobs(params);
      setJobs(d.jobs);
      setTotal(d.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const selectableIds = jobs.filter((j) => CANCELLABLE.has(j.status)).map((j) => j.id);
  const allSelected   = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected  = selected.size > 0;

  function toggleAll() { allSelected ? setSelected(new Set()) : setSelected(new Set(selectableIds)); }
  function toggleOne(id: string) { setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  async function doBulkCancel() {
    if (!bulkReason.trim() || !selected.size) return;
    setBulkWorking(true);
    try {
      await api.bulkCancelJobs([...selected], bulkReason);
      await load();
      setBulkModal(false);
      setBulkReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setBulkWorking(false); }
  }

  async function doCancel() {
    if (!cancelModal || !cancelReason.trim()) return;
    setActionId(cancelModal.jobId);
    try {
      await api.cancelJob(cancelModal.jobId, cancelReason);
      setJobs((prev) => prev.map((j) => j.id === cancelModal.jobId ? { ...j, status: "CANCELLED" } : j));
      setCancelModal(null);
      setCancelReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="page-wrap">
      <div className="page-header">
        <p className="page-eyebrow">Operations</p>
        <h1 className="page-title">Jobs</h1>
      </div>

      <div className="toolbar">
        <select className="tw-select" style={{ width: "auto" }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {JOB_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        {someSelected && (
          <div className="bulk-bar">
            <span className="bulk-bar-count">{selected.size} selected</span>
            <div className="bulk-bar-divider" />
            <button className="btn btn-danger btn-sm" onClick={() => setBulkModal(true)}>Force cancel</button>
          </div>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tw-card">
        <table className="tw-table">
          <thead>
            <tr>
              <th style={{ width: 44, paddingRight: 0 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 accent-[#4f7cff] cursor-pointer" title="Select all cancellable jobs" />
              </th>
              <th>Route</th>
              <th>Shipper</th>
              <th>Driver</th>
              <th>Load</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "48px 20px", color: "var(--color-text-muted)", fontSize: 14 }}>Loading…</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/>
                  </svg>
                  <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>No jobs found</span>
                </div>
              </td></tr>
            ) : jobs.map((j) => {
              const cancellable = CANCELLABLE.has(j.status);
              const driver = j.bids[0]?.driver.user;
              return (
                <tr key={j.id} className={selected.has(j.id) ? "row-selected" : ""}>
                  <td style={{ paddingRight: 0 }}>
                    {cancellable
                      ? <input type="checkbox" checked={selected.has(j.id)} onChange={() => toggleOne(j.id)} className="w-4 h-4 accent-[#4f7cff] cursor-pointer" />
                      : <span style={{ display: "block", width: 16 }} />}
                  </td>
                  <td style={{ maxWidth: 220 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {j.originAddress}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M6 1v10M2 7l4 4 4-4"/>
                      </svg>
                      <span style={{ fontSize: 13, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {j.destAddress}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={j.shipper.user.name} size={28} />
                      <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{j.shipper.user.name}</span>
                    </div>
                  </td>
                  <td>
                    {driver ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={driver.name} size={28} />
                        <span style={{ fontSize: 13, color: "var(--color-text-primary)" }}>{driver.name}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div className="num" style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{j.requiredTonnes}t</div>
                    <div className="num" style={{ fontSize: 13, fontWeight: 700, color: "#F5A623", marginTop: 2 }}>${j.askingPrice}</div>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[j.status] ?? "badge-gray"}`}>{j.status.replace(/_/g, " ")}</span></td>
                  <td className="num" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                    {new Date(j.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="text-right">
                    {cancellable && (
                      <button className="btn btn-danger btn-sm" disabled={actionId === j.id} onClick={() => setCancelModal({ jobId: j.id })}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="num" style={{ fontSize: 13 }}>{total.toLocaleString()} jobs — page {page} of {pages}</span>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1}    onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {bulkModal && (
        <div className="overlay">
          <div className="dialog">
            <h3 className="dialog-title">Force-cancel {selected.size} job{selected.size > 1 ? "s" : ""}</h3>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              This will immediately cancel all selected jobs and notify both parties. This cannot be undone.
            </p>
            <div className="field">
              <label className="field-label">Reason (required)</label>
              <textarea className="tw-textarea" placeholder="Reason for cancellation…" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => { setBulkModal(false); setBulkReason(""); }}>Cancel</button>
              <button className="btn btn-danger" disabled={!bulkReason.trim() || bulkWorking} onClick={doBulkCancel}>
                {bulkWorking ? "Working…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelModal && (
        <div className="overlay">
          <div className="dialog">
            <h3 className="dialog-title">Force-cancel job</h3>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>This will immediately cancel the job and notify both parties. This cannot be undone.</p>
            <div className="field">
              <label className="field-label">Reason (required)</label>
              <textarea className="tw-textarea" placeholder="Reason for cancellation…" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => { setCancelModal(null); setCancelReason(""); }}>Cancel</button>
              <button className="btn btn-danger" disabled={!cancelReason.trim() || actionId === cancelModal.jobId} onClick={doCancel}>
                {actionId === cancelModal.jobId ? "…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
