"use client";
import { useEffect, useState } from "react";
import { api, JobRecord } from "@/lib/api";
import styles from "./jobs.module.css";

const CANCELLABLE = ["POSTED", "BIDDING", "RADIUS_EXPANDED", "MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT"];

const STATUS_BADGE: Record<string, string> = {
  POSTED:           "badge-amber",
  BIDDING:          "badge-amber",
  RADIUS_EXPANDED:  "badge-amber",
  MATCHED:          "badge-blue",
  PICKUP_EN_ROUTE:  "badge-blue",
  PICKUP_ARRIVED:   "badge-blue",
  LOADED:           "badge-blue",
  IN_TRANSIT:       "badge-blue",
  DELIVERED:        "badge-green",
  COMPLETED:        "badge-green",
  CANCELLED:        "badge-gray",
  DISPUTED:         "badge-red",
};

const JOB_STATUSES = [
  "POSTED", "BIDDING", "RADIUS_EXPANDED", "MATCHED",
  "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT",
  "DELIVERED", "COMPLETED", "CANCELLED", "DISPUTED",
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [cancelModal, setCancelModal] = useState<{ jobId: string } | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 50;

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (status) params.status = status;
      const d = await api.getJobs(params);
      setJobs(d.jobs);
      setTotal(d.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div>
      <h1 className={styles.heading}>Jobs</h1>

      <div className={styles.toolbar}>
        <select className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div style={{ color: "var(--red)", marginBottom: 12 }}>{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Shipper</th>
              <th>Driver</th>
              <th>Tonnes</th>
              <th>Price</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ color: "var(--text-2)", padding: 24 }}>Loading…</td></tr>
            ) : jobs.map((j) => (
              <tr key={j.id}>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{j.originAddress}</div>
                  <div style={{ fontSize: 11, color: "var(--text-2)" }}>→ {j.destAddress}</div>
                </td>
                <td style={{ fontSize: 13 }}>{j.shipper.user.name}</td>
                <td style={{ fontSize: 13 }}>
                  {j.bids[0]?.driver.user.name ?? <span style={{ color: "var(--text-2)" }}>—</span>}
                </td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{j.requiredTonnes}t</td>
                <td style={{ fontVariantNumeric: "tabular-nums", color: "var(--accent)", fontWeight: 600 }}>
                  ${j.askingPrice}
                </td>
                <td>
                  <span className={`badge ${STATUS_BADGE[j.status] ?? "badge-gray"}`}>{j.status}</span>
                </td>
                <td style={{ color: "var(--text-2)", fontSize: 12 }}>
                  {new Date(j.createdAt).toLocaleDateString()}
                </td>
                <td>
                  {CANCELLABLE.includes(j.status) && (
                    <button className="btn btn-danger" style={{ fontSize: 12, padding: "4px 10px" }}
                      onClick={() => setCancelModal({ jobId: j.id })}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span style={{ color: "var(--text-2)", fontSize: 13 }}>
          {total} jobs · page {page} of {Math.max(1, Math.ceil(total / LIMIT))}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost" disabled={page * LIMIT >= total} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {cancelModal && (
        <div className={styles.overlay}>
          <div className={`card ${styles.dialog}`}>
            <h3 className={styles.dialogTitle}>Force-cancel job</h3>
            <p style={{ fontSize: 13, color: "var(--text-2)" }}>
              This will immediately cancel the job and notify both parties. This cannot be undone.
            </p>
            <textarea className="input" placeholder="Reason for cancellation…"
              value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              rows={3} style={{ width: "100%", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => { setCancelModal(null); setCancelReason(""); }}>Cancel</button>
              <button className="btn btn-danger" disabled={!cancelReason.trim() || actionId === cancelModal.jobId}
                onClick={doCancel}>
                {actionId === cancelModal.jobId ? "…" : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
