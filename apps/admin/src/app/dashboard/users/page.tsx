"use client";
import { useEffect, useState, useCallback } from "react";
import { api, UserRecord } from "@/lib/api";

const LIMIT = 50;

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

export default function UsersPage() {
  const [users,      setUsers]      = useState<UserRecord[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
  const [role,       setRole]       = useState("");
  const [suspended,  setSuspended]  = useState("");
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Set<string>>(new Set());
  const [bulkModal,  setBulkModal]  = useState<"suspend" | "unsuspend" | null>(null);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkWorking,setBulkWorking]= useState(false);
  const [singleModal,  setSingleModal]  = useState<{ userId: string; name: string } | null>(null);
  const [singleReason, setSingleReason] = useState("");
  const [actionId,   setActionId]   = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (search)    params.search    = search;
      if (role)      params.role      = role;
      if (suspended) params.suspended = suspended;
      const d = await api.getUsers(params);
      setUsers(d.users);
      setTotal(d.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page, role, suspended]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (page !== 1) setPage(1); else load();
  }

  const allSelected  = users.length > 0 && users.every((u) => selected.has(u.id));
  const someSelected = selected.size > 0;
  function toggleAll() { allSelected ? setSelected(new Set()) : setSelected(new Set(users.map((u) => u.id))); }
  function toggleOne(id: string) { setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  async function doBulk() {
    if (!bulkModal || !selected.size) return;
    if (bulkModal === "suspend" && !bulkReason.trim()) return;
    setBulkWorking(true);
    try {
      const ids = [...selected];
      if (bulkModal === "suspend")   await api.bulkSuspendUsers(ids, bulkReason);
      if (bulkModal === "unsuspend") await api.bulkUnsuspendUsers(ids);
      await load();
      setBulkModal(null);
      setBulkReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setBulkWorking(false); }
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
    if (!singleModal || !singleReason.trim()) return;
    setActionId(singleModal.userId);
    try {
      await api.suspendUser(singleModal.userId, singleReason);
      setUsers((prev) => prev.map((u) => u.id === singleModal.userId ? { ...u, isSuspended: true, suspensionReason: singleReason } : u));
      setSingleModal(null);
      setSingleReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="page-wrap">
      <div className="page-header">
        <p className="page-eyebrow">Operations</p>
        <h1 className="page-title">Users</h1>
      </div>

      <div className="toolbar">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-0" style={{ maxWidth: 340 }}>
          <input className="tw-input flex-1 min-w-0" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-ghost btn-sm" type="submit">Search</button>
        </form>
        <select className="tw-select" style={{ width: "auto" }} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="SHIPPER">Shippers</option>
          <option value="DRIVER">Drivers</option>
          <option value="BOTH">Both</option>
        </select>
        <select className="tw-select" style={{ width: "auto" }} value={suspended} onChange={(e) => { setSuspended(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </select>
        {someSelected && (
          <div className="bulk-bar">
            <span className="bulk-bar-count">{selected.size} selected</span>
            <div className="bulk-bar-divider" />
            <button className="btn btn-ghost btn-sm" onClick={() => setBulkModal("unsuspend")}>Unsuspend</button>
            <button className="btn btn-danger btn-sm" onClick={() => setBulkModal("suspend")}>Suspend</button>
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
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 20px", color: "var(--color-text-muted)", fontSize: 14 }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                  <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>No users found</span>
                </div>
              </td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className={selected.has(u.id) ? "row-selected" : ""}>
                <td style={{ paddingRight: 0 }}>
                  <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="w-4 h-4 accent-[#4f7cff] cursor-pointer" />
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={u.name} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{u.name}</div>
                      <div className="num" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{u.phone}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-gray">{u.role}</span></td>
                <td>
                  {u.isSuspended
                    ? <span className="badge badge-red" title={u.suspensionReason ?? ""}>Suspended</span>
                    : <span className="badge badge-green">Active</span>}
                </td>
                <td className="num" style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="text-right">
                  {u.isSuspended
                    ? <button className="btn btn-ghost btn-sm" disabled={actionId === u.id} onClick={() => doUnsuspend(u.id)}>
                        {actionId === u.id ? "…" : "Unsuspend"}
                      </button>
                    : <button className="btn btn-danger btn-sm" onClick={() => setSingleModal({ userId: u.id, name: u.name })}>
                        Suspend
                      </button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="num" style={{ fontSize: 13 }}>{total.toLocaleString()} users — page {page} of {pages}</span>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1}     onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {bulkModal && (
        <div className="overlay">
          <div className="dialog">
            <h3 className="dialog-title">
              {bulkModal === "suspend" ? `Suspend ${selected.size} user${selected.size > 1 ? "s" : ""}` : `Unsuspend ${selected.size} user${selected.size > 1 ? "s" : ""}`}
            </h3>
            {bulkModal === "suspend" ? (
              <div className="field">
                <label className="field-label">Reason (required)</label>
                <textarea className="tw-textarea" placeholder="Reason for suspension…" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} rows={3} />
              </div>
            ) : (
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>This will lift the suspension on all {selected.size} selected users.</p>
            )}
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => { setBulkModal(null); setBulkReason(""); }}>Cancel</button>
              <button className={bulkModal === "suspend" ? "btn btn-danger" : "btn btn-primary"} disabled={bulkWorking || (bulkModal === "suspend" && !bulkReason.trim())} onClick={doBulk}>
                {bulkWorking ? "Working…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {singleModal && (
        <div className="overlay">
          <div className="dialog">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={singleModal.name} size={40} />
              <div>
                <h3 className="dialog-title">Suspend {singleModal.name}</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>This action will immediately lock the account.</p>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Reason (required)</label>
              <textarea className="tw-textarea" placeholder="Reason for suspension…" value={singleReason} onChange={(e) => setSingleReason(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => { setSingleModal(null); setSingleReason(""); }}>Cancel</button>
              <button className="btn btn-danger" disabled={!singleReason.trim() || actionId === singleModal.userId} onClick={doSuspend}>
                {actionId === singleModal.userId ? "…" : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
