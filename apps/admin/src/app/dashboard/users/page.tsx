"use client";
import { useEffect, useState, useCallback } from "react";
import { api, UserRecord } from "@/lib/api";
import {
  PageHead, SearchInput, Select, Badge, Check, Avatar, Modal, Pager,
  LoadingRow, EmptyRow, roleBadge,
} from "@/components/ui";

const LIMIT = 25;

export default function UsersPage() {
  const [users,        setUsers]        = useState<UserRecord[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState("");
  const [role,         setRole]         = useState("");
  const [suspended,    setSuspended]    = useState("");
  const [loading,      setLoading]      = useState(true);
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [bulkModal,    setBulkModal]    = useState<"suspend" | "unsuspend" | null>(null);
  const [bulkReason,   setBulkReason]   = useState("");
  const [bulkWorking,  setBulkWorking]  = useState(false);
  const [singleModal,  setSingleModal]  = useState<{ userId: string; name: string } | null>(null);
  const [singleReason, setSingleReason] = useState("");
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [error,        setError]        = useState<string | null>(null);

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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, role, suspended, search]);

  useEffect(() => { load(); }, [load]);

  const allSelected  = users.length > 0 && users.every((u) => selected.has(u.id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(users.map((u) => u.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

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
      setUsers((prev) => prev.map((u) =>
        u.id === userId ? { ...u, isSuspended: false, suspensionReason: null } : u,
      ));
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  async function doSuspend() {
    if (!singleModal || !singleReason.trim()) return;
    setActionId(singleModal.userId);
    try {
      await api.suspendUser(singleModal.userId, singleReason);
      setUsers((prev) => prev.map((u) =>
        u.id === singleModal.userId ? { ...u, isSuspended: true, suspensionReason: singleReason } : u,
      ));
      setSingleModal(null);
      setSingleReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <PageHead eyebrow="Operations" title="Users" sub="All registered accounts" />

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name or phone…"
        />
        <Select
          value={role}
          onChange={(v) => { setRole(v); setPage(1); }}
          style={{ width: 170 }}
        >
          <option value="">All roles</option>
          <option value="SHIPPER">Shippers</option>
          <option value="DRIVER">Drivers</option>
          <option value="BOTH">Both</option>
        </Select>
        <Select
          value={suspended}
          onChange={(v) => { setSuspended(v); setPage(1); }}
          style={{ width: 170 }}
        >
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Suspended</option>
        </Select>
      </div>

      {someSelected && (
        <div className="bulkbar">
          <span><span className="count">{selected.size}</span> selected</span>
          <div className="grow" />
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn ghost sm" onClick={() => setBulkModal("unsuspend")}>Unsuspend</button>
          <button className="btn danger sm" onClick={() => setBulkModal("suspend")}>Suspend</button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="table-scroll">
        <table className="t">
          <thead>
            <tr>
              <th style={{ width: 38 }}>
                <Check
                  on={allSelected}
                  onClick={toggleAll}
                  label="select all"
                />
              </th>
              <th>Name</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={7} />
            ) : users.length === 0 ? (
              <EmptyRow
                colSpan={7}
                icon={
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                }
                message="No users found"
              />
            ) : users.map((u) => {
              const r = roleBadge(u.role);
              return (
                <tr key={u.id} className={selected.has(u.id) ? "selected" : ""}>
                  <td>
                    <Check
                      on={selected.has(u.id)}
                      onClick={() => toggleOne(u.id)}
                      label={`select ${u.name}`}
                    />
                  </td>
                  <td>
                    <div className="user-cell">
                      <Avatar name={u.name} size="sm" />
                      <div className="name">{u.name}</div>
                    </div>
                  </td>
                  <td className="mono" style={{ color: "var(--color-text-secondary)" }}>{u.phone}</td>
                  <td><Badge tone={r.tone}>{r.label}</Badge></td>
                  <td>
                    {u.isSuspended
                      ? <Badge tone="red" dot>SUSPENDED</Badge>
                      : <Badge tone="green" dot>ACTIVE</Badge>}
                  </td>
                  <td className="mono" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(u.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
                  <td>
                    <div className="row-actions">
                      {u.isSuspended ? (
                        <button
                          className="btn ghost sm"
                          disabled={actionId === u.id}
                          onClick={() => doUnsuspend(u.id)}
                        >
                          {actionId === u.id ? "…" : "Unsuspend"}
                        </button>
                      ) : (
                        <button
                          className="btn danger sm"
                          onClick={() => setSingleModal({ userId: u.id, name: u.name })}
                        >
                          Suspend
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

      <Pager
        page={page}
        totalPages={totalPages}
        total={total}
        perPage={LIMIT}
        onPage={setPage}
        unit="users"
      />

      {/* Bulk suspend / unsuspend modal */}
      <Modal open={!!bulkModal} onClose={() => { setBulkModal(null); setBulkReason(""); }}>
        <h3>
          {bulkModal === "suspend"
            ? `Suspend ${selected.size} user${selected.size > 1 ? "s" : ""}`
            : `Unsuspend ${selected.size} user${selected.size > 1 ? "s" : ""}`}
        </h3>
        {bulkModal === "suspend" ? (
          <>
            <p className="body">
              Suspended accounts lose platform access immediately. Active bids and jobs are not affected.
            </p>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">
                Reason <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <textarea
                className="input"
                placeholder="Explain why these accounts are being suspended…"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
              />
            </div>
          </>
        ) : (
          <p className="body">This will lift the suspension on all {selected.size} selected users.</p>
        )}
        <div className="actions">
          <button className="btn ghost" onClick={() => { setBulkModal(null); setBulkReason(""); }}>Cancel</button>
          <button
            className={bulkModal === "suspend" ? "btn danger" : "btn primary"}
            disabled={bulkWorking || (bulkModal === "suspend" && !bulkReason.trim())}
            onClick={doBulk}
          >
            {bulkWorking ? "Working…" : "Confirm"}
          </button>
        </div>
      </Modal>

      {/* Single suspend modal */}
      <Modal
        open={!!singleModal}
        onClose={() => { setSingleModal(null); setSingleReason(""); }}
      >
        {singleModal && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <Avatar name={singleModal.name} size="lg" />
              <div>
                <h3 style={{ marginBottom: 2 }}>Suspend {singleModal.name}</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  This will immediately lock the account.
                </p>
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">
                Reason <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <textarea
                className="input"
                placeholder="Reason for suspension…"
                value={singleReason}
                onChange={(e) => setSingleReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="actions">
              <button
                className="btn ghost"
                onClick={() => { setSingleModal(null); setSingleReason(""); }}
              >
                Cancel
              </button>
              <button
                className="btn danger"
                disabled={!singleReason.trim() || actionId === singleModal.userId}
                onClick={doSuspend}
              >
                {actionId === singleModal.userId ? "…" : "Suspend account"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
