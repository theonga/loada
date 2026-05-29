"use client";
import { useEffect, useState, useCallback } from "react";
import { api, JobRecord } from "@/lib/api";
import {
  PageHead, SearchInput, Select, Badge, Check, Modal, Pager,
  LoadingRow, EmptyRow, statusTone,
} from "@/components/ui";

const CANCELLABLE = new Set([
  "POSTED", "BIDDING", "RADIUS_EXPANDED",
  "MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT",
]);

const JOB_STATUSES = [
  "POSTED", "BIDDING", "RADIUS_EXPANDED", "MATCHED",
  "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT",
  "DELIVERED", "COMPLETED", "CANCELLED", "DISPUTED",
];

const LIMIT = 25;

export default function JobsPage() {
  const [jobs,        setJobs]        = useState<JobRecord[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkOpen,    setBulkOpen]    = useState(false);
  const [bulkReason,  setBulkReason]  = useState("");
  const [bulkWorking, setBulkWorking] = useState(false);
  const [cancelOne,   setCancelOne]   = useState<JobRecord | null>(null);
  const [cancelReason,setCancelReason]= useState("");
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (status) params.status = status;
      const d = await api.getJobs(params);
      const q = search.trim().toLowerCase();
      const filtered = q
        ? d.jobs.filter((j) =>
            j.originAddress.toLowerCase().includes(q) ||
            j.destAddress.toLowerCase().includes(q) ||
            j.shipper.user.name.toLowerCase().includes(q),
          )
        : d.jobs;
      setJobs(filtered);
      setTotal(q ? filtered.length : d.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const cancellableSelected = jobs.filter((j) =>
    selected.has(j.id) && CANCELLABLE.has(j.status),
  );

  const selectableIds = jobs.filter((j) => CANCELLABLE.has(j.status)).map((j) => j.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function doBulkCancel() {
    if (!bulkReason.trim() || !cancellableSelected.length) return;
    setBulkWorking(true);
    try {
      await api.bulkCancelJobs(cancellableSelected.map((j) => j.id), bulkReason);
      await load();
      setBulkOpen(false);
      setBulkReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setBulkWorking(false); }
  }

  async function doCancelOne() {
    if (!cancelOne || !cancelReason.trim()) return;
    setActionId(cancelOne.id);
    try {
      await api.cancelJob(cancelOne.id, cancelReason);
      setJobs((prev) => prev.map((j) =>
        j.id === cancelOne.id ? { ...j, status: "CANCELLED" } : j,
      ));
      setCancelOne(null);
      setCancelReason("");
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <PageHead
        eyebrow="Operations"
        title="Jobs"
        sub="All loads posted on the platform"
      />

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by origin, destination or shipper…"
        />
        <Select
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          style={{ width: 220 }}
        >
          <option value="">All statuses</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </Select>
      </div>

      {someSelected && (
        <div className="bulkbar">
          <span>
            <span className="count">{selected.size}</span> selected ·{" "}
            <span className="mono">{cancellableSelected.length}</span> cancellable
          </span>
          <div className="grow" />
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button
            className="btn danger sm"
            disabled={cancellableSelected.length === 0}
            onClick={() => setBulkOpen(true)}
          >
            Force cancel
          </button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="table-scroll">
        <table className="t">
          <thead>
            <tr>
              <th style={{ width: 38 }}>
                <Check on={allSelected} onClick={toggleAll} label="select all cancellable" />
              </th>
              <th>Route</th>
              <th>Load</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th>Status</th>
              <th>Shipper</th>
              <th>Driver</th>
              <th>Posted</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={9} />
            ) : jobs.length === 0 ? (
              <EmptyRow
                colSpan={9}
                icon={
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <path d="M9 7h6M9 11h6M9 15h4" />
                  </svg>
                }
                message="No jobs found"
              />
            ) : jobs.map((j) => {
              const cancellable = CANCELLABLE.has(j.status);
              const driver = j.bids[0]?.driver.user;
              return (
                <tr key={j.id} className={selected.has(j.id) ? "selected" : ""}>
                  <td>
                    {cancellable
                      ? <Check on={selected.has(j.id)} onClick={() => toggleOne(j.id)} />
                      : <span style={{ display: "inline-block", width: 16 }} />}
                  </td>
                  <td>
                    <div className="route-cell" style={{ maxWidth: 240 }}>
                      <div className="from truncate">{j.originAddress}</div>
                      <div className="to truncate">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="13 6 19 12 13 18" />
                        </svg>
                        {j.destAddress}
                      </div>
                    </div>
                  </td>
                  <td className="mono">{j.requiredTonnes}t</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                    ${Number(j.askingPrice).toFixed(2)}
                  </td>
                  <td><Badge tone={statusTone(j.status)}>{j.status.replace(/_/g, " ")}</Badge></td>
                  <td className="truncate" style={{ color: "var(--color-text-secondary)" }}>
                    {j.shipper.user.name}
                  </td>
                  <td style={{ color: driver ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                    {driver ? driver.name : "—"}
                  </td>
                  <td className="mono" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(j.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit", month: "short",
                    })}
                  </td>
                  <td>
                    <div className="row-actions">
                      {cancellable ? (
                        <button
                          className="btn danger sm"
                          disabled={actionId === j.id}
                          onClick={() => setCancelOne(j)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>—</span>
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
        unit="jobs"
      />

      {/* Bulk cancel modal */}
      <Modal open={bulkOpen} onClose={() => { setBulkOpen(false); setBulkReason(""); }}>
        <h3>Cancel {cancellableSelected.length} job{cancellableSelected.length === 1 ? "" : "s"}?</h3>
        <p className="body">
          This action is irreversible. All affected drivers and shippers will be notified,
          and any reserved commission will be refunded.
        </p>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">
            Reason <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <textarea
            className="input"
            placeholder="Why are you force-cancelling?"
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
          />
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => { setBulkOpen(false); setBulkReason(""); }}>Cancel</button>
          <button
            className="btn danger"
            disabled={!bulkReason.trim() || bulkWorking}
            onClick={doBulkCancel}
          >
            {bulkWorking ? "Working…" : "Force cancel"}
          </button>
        </div>
      </Modal>

      {/* Single cancel modal */}
      <Modal open={!!cancelOne} onClose={() => { setCancelOne(null); setCancelReason(""); }}>
        {cancelOne && (
          <>
            <h3>Cancel this job?</h3>
            <p className="body">
              This action is irreversible. The driver and shipper will be notified,
              and any reserved commission will be refunded.
            </p>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">
                Reason <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <textarea
                className="input"
                placeholder="Why are you force-cancelling?"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="actions">
              <button className="btn ghost" onClick={() => { setCancelOne(null); setCancelReason(""); }}>Cancel</button>
              <button
                className="btn danger"
                disabled={!cancelReason.trim() || actionId === cancelOne.id}
                onClick={doCancelOne}
              >
                {actionId === cancelOne.id ? "…" : "Force cancel"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
