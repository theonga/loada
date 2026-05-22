"use client";
import { useEffect, useState } from "react";
import { api, UserRecord } from "@/lib/api";
import styles from "./users.module.css";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [suspended, setSuspended] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ userId: string; name: string } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const LIMIT = 50;

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (search) params.search = search;
      if (role) params.role = role;
      if (suspended) params.suspended = suspended;
      const d = await api.getUsers(params);
      setUsers(d.users);
      setTotal(d.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, role, suspended]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function doUnsuspend(userId: string) {
    setActionId(userId);
    try {
      await api.unsuspendUser(userId);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isSuspended: false, suspensionReason: null } : u));
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  async function doSuspend() {
    if (!modal || !reason.trim()) return;
    setActionId(modal.userId);
    try {
      await api.suspendUser(modal.userId, reason);
      setUsers((prev) => prev.map((u) => u.id === modal.userId ? { ...u, isSuspended: true, suspensionReason: reason } : u));
      setModal(null);
      setReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  return (
    <div>
      <h1 className={styles.heading}>Users</h1>

      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input className="input" placeholder="Search by name…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
          <button className="btn btn-ghost" type="submit">Search</button>
        </form>

        <div className={styles.filters}>
          <select className="select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="SHIPPER">Shippers</option>
            <option value="DRIVER">Drivers</option>
            <option value="BOTH">Both</option>
          </select>
          <select className="select" value={suspended} onChange={(e) => { setSuspended(e.target.value); setPage(1); }}>
            <option value="">All status</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
        </div>
      </div>

      {error && <div style={{ color: "var(--red)", marginBottom: 12 }}>{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ color: "var(--text-2)", padding: 24 }}>Loading…</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td className={styles.name}>{u.name}</td>
                <td style={{ fontFamily: "monospace", fontSize: 12 }}>{u.phone}</td>
                <td><span className="badge badge-gray">{u.role}</span></td>
                <td>
                  {u.isSuspended
                    ? <span className="badge badge-red" title={u.suspensionReason ?? ""}>Suspended</span>
                    : <span className="badge badge-green">Active</span>}
                </td>
                <td style={{ color: "var(--text-2)", fontSize: 12 }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td>
                  {u.isSuspended
                    ? <button className="btn btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}
                        disabled={actionId === u.id} onClick={() => doUnsuspend(u.id)}>
                        {actionId === u.id ? "…" : "Unsuspend"}
                      </button>
                    : <button className="btn btn-danger" style={{ fontSize: 12, padding: "4px 10px" }}
                        onClick={() => setModal({ userId: u.id, name: u.name })}>
                        Suspend
                      </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <span style={{ color: "var(--text-2)", fontSize: 13 }}>
          {total} users · page {page} of {Math.max(1, Math.ceil(total / LIMIT))}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost" disabled={page * LIMIT >= total} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {modal && (
        <div className={styles.overlay}>
          <div className={`card ${styles.dialog}`}>
            <h3 className={styles.dialogTitle}>Suspend {modal.name}</h3>
            <textarea className={`input ${styles.reasonInput}`} placeholder="Reason for suspension…"
              value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            <div className={styles.dialogActions}>
              <button className="btn btn-ghost" onClick={() => { setModal(null); setReason(""); }}>Cancel</button>
              <button className="btn btn-danger" disabled={!reason.trim() || actionId === modal.userId}
                onClick={doSuspend}>
                {actionId === modal.userId ? "…" : "Confirm Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
