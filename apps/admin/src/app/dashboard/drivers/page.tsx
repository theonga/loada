"use client";
import { useEffect, useState } from "react";
import { api, DriverRecord } from "@/lib/api";
import styles from "./drivers.module.css";

const DOC_STATUS_BADGE: Record<string, string> = {
  PENDING:      "badge-amber",
  UNDER_REVIEW: "badge-blue",
  APPROVED:     "badge-green",
  REJECTED:     "badge-red",
  EXPIRED:      "badge-red",
};

const SUB_STATUS_BADGE: Record<string, string> = {
  ACTIVE:    "badge-green",
  TRIAL:     "badge-blue",
  EXPIRED:   "badge-red",
  CANCELLED: "badge-gray",
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [docStatus, setDocStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ driverId: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 50;

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (docStatus) params.documentStatus = docStatus;
      const d = await api.getDrivers(params);
      setDrivers(d.drivers);
      setTotal(d.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, docStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  async function approve(driverId: string) {
    setActionId(driverId);
    try {
      await api.approveDocs(driverId);
      setDrivers((prev) => prev.map((d) => d.id === driverId ? { ...d, documentStatus: "APPROVED" } : d));
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  async function doReject() {
    if (!rejectModal || !rejectReason.trim()) return;
    setActionId(rejectModal.driverId);
    try {
      await api.rejectDocs(rejectModal.driverId, rejectReason);
      setDrivers((prev) => prev.map((d) => d.id === rejectModal.driverId ? { ...d, documentStatus: "REJECTED" } : d));
      setRejectModal(null);
      setRejectReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  return (
    <div>
      <h1 className={styles.heading}>Drivers</h1>

      <div className={styles.toolbar}>
        <select className="select" value={docStatus} onChange={(e) => { setDocStatus(e.target.value); setPage(1); }}>
          <option value="">All document statuses</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {error && <div style={{ color: "var(--red)", marginBottom: 12 }}>{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Capacity</th>
              <th>Documents</th>
              <th>Subscription</th>
              <th>Online</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ color: "var(--text-2)", padding: 24 }}>Loading…</td></tr>
            ) : drivers.map((d) => (
              <tr key={d.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{d.user.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "monospace" }}>{d.user.phone}</div>
                </td>
                <td style={{ fontSize: 13 }}>
                  {d.truckMake} {d.truckModel}
                  <div style={{ fontSize: 11, color: "var(--text-2)" }}>{d.truckRegistration}</div>
                </td>
                <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{d.capacityTonnes}t</td>
                <td>
                  <span className={`badge ${DOC_STATUS_BADGE[d.documentStatus] ?? "badge-gray"}`}>
                    {d.documentStatus}
                  </span>
                </td>
                <td>
                  {d.subscription
                    ? <span className={`badge ${SUB_STATUS_BADGE[d.subscription.status] ?? "badge-gray"}`}>
                        {d.subscription.status}
                      </span>
                    : <span style={{ color: "var(--text-2)", fontSize: 12 }}>None</span>}
                </td>
                <td>
                  <span style={{ color: d.isOnline ? "var(--green)" : "var(--text-2)", fontSize: 12 }}>
                    {d.isOnline ? "● Online" : "○ Offline"}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    {d.documentStatus !== "APPROVED" && (
                      <button className="btn btn-primary" style={{ fontSize: 12, padding: "4px 10px" }}
                        disabled={actionId === d.id} onClick={() => approve(d.id)}>
                        {actionId === d.id ? "…" : "Approve"}
                      </button>
                    )}
                    {d.documentStatus !== "REJECTED" && (
                      <button className="btn btn-danger" style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={() => setRejectModal({ driverId: d.id, name: d.user.name })}>
                        Reject
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span style={{ color: "var(--text-2)", fontSize: 13 }}>
          {total} drivers · page {page} of {Math.max(1, Math.ceil(total / LIMIT))}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost" disabled={page * LIMIT >= total} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {rejectModal && (
        <div className={styles.overlay}>
          <div className={`card ${styles.dialog}`}>
            <h3 className={styles.dialogTitle}>Reject documents — {rejectModal.name}</h3>
            <textarea className="input" placeholder="Reason for rejection…"
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              rows={3} style={{ width: "100%", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => { setRejectModal(null); setRejectReason(""); }}>Cancel</button>
              <button className="btn btn-danger" disabled={!rejectReason.trim() || actionId === rejectModal.driverId}
                onClick={doReject}>
                {actionId === rejectModal.driverId ? "…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
