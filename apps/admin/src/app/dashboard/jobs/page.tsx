"use client";
import { useEffect, useState, useCallback } from "react";
import { api, JobRecord, JobDetail } from "@/lib/api";
import {
  PageHead, SearchInput, Select, Badge, Check, Modal, Pager,
  LoadingRow, EmptyRow, statusTone, Avatar,
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
  const [detail,      setDetail]      = useState<JobDetail | null>(null);
  const [detailId,    setDetailId]    = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = useCallback(async (jobId: string) => {
    setDetailId(jobId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { job } = await api.getJob(jobId);
      setDetail(job);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setDetailId(null);
    setDetail(null);
  }, []);

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
              <th>Cargo</th>
              <th>Load</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right" }}>Bids</th>
              <th>Status</th>
              <th>Shipper</th>
              <th>Driver</th>
              <th>Posted</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={11} />
            ) : jobs.length === 0 ? (
              <EmptyRow
                colSpan={11}
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
              const acceptedBid = j.bids.find((b) => b.status === "ACCEPTED");
              const driver = acceptedBid?.driver.user;
              const totalBids = j._count?.bids ?? j.bids.length;
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
                  <td style={{ maxWidth: 200 }}>
                    <div className="truncate" style={{ color: "var(--color-text-primary)", fontSize: 13 }}>
                      {j.cargoDescription}
                    </div>
                    {j.specialRequirements.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {j.specialRequirements.map((r) => (
                          <span key={r} style={{
                            fontSize: 10, padding: "2px 6px", borderRadius: 4,
                            background: "var(--color-raised)", color: "var(--color-text-muted)",
                            fontWeight: 600, letterSpacing: 0.3,
                          }}>{r}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="mono">{j.requiredTonnes}t</td>
                  <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                    ${Number(j.askingPrice).toFixed(2)}
                  </td>
                  <td className="mono" style={{ textAlign: "right", color: totalBids > 0 ? "var(--color-accent)" : "var(--color-text-muted)" }}>
                    {totalBids}
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
                      <button
                        className="btn ghost sm"
                        onClick={() => openDetail(j.id)}
                      >
                        View
                      </button>
                      {cancellable ? (
                        <button
                          className="btn danger sm"
                          disabled={actionId === j.id}
                          onClick={() => setCancelOne(j)}
                        >
                          Cancel
                        </button>
                      ) : null}
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

      {/* Job detail modal */}
      <Modal open={!!detailId} onClose={closeDetail} wide>
        {detailLoading || !detail ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-secondary)" }}>
            Loading job…
          </div>
        ) : (
          <JobDetailView job={detail} />
        )}
        <div className="actions">
          <button className="btn ghost" onClick={closeDetail}>Close</button>
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

// ── Job detail view ─────────────────────────────────────────────────────────────

function JobDetailView({ job }: { job: JobDetail }) {
  const fmtDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h3 style={{ marginBottom: 4 }}>{job.originAddress} → {job.destAddress}</h3>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            <span className="mono">{job.id.slice(0, 8)}</span> · created {fmtDate(job.createdAt)}
          </div>
        </div>
        <Badge tone={statusTone(job.status)}>{job.status.replace(/_/g, " ")}</Badge>
      </div>

      {/* Key facts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <DetailField label="Asking price" value={`$${Number(job.askingPrice).toFixed(2)} ${job.currency}`} mono />
        <DetailField label="Required tonnes" value={`${job.requiredTonnes}t`} mono />
        <DetailField label="Truck type" value={(job.requiredTruckType ?? "—").replace(/_/g, " ")} />
        <DetailField label="Payment method" value={(job.paymentMethod ?? "—").replace(/_/g, " ")} />
        <DetailField label="Search radius" value={`${job.searchRadiusKm} km`} mono />
        <DetailField label="Bidding closes" value={fmtDate(job.biddingExpiresAt)} mono />
        <DetailField label="Total bids" value={`${job._count?.bids ?? job.bids.length}`} mono />
        <DetailField label="Messages" value={`${job._count?.messages ?? job.messages.length}`} mono />
      </div>

      {/* Cargo */}
      <DetailBlock label="Cargo">
        <div style={{ fontSize: 14 }}>{job.cargoDescription}</div>
        {job.specialRequirements.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {job.specialRequirements.map((r) => (
              <span key={r} style={{
                fontSize: 11, padding: "3px 8px", borderRadius: 4,
                background: "var(--color-raised)", color: "var(--color-text-secondary)",
                fontWeight: 600, letterSpacing: 0.3,
              }}>{r}</span>
            ))}
          </div>
        )}
      </DetailBlock>

      {/* Shipper */}
      <DetailBlock label="Shipper">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={job.shipper.user.name} size="sm" />
          <div>
            <div style={{ fontWeight: 500 }}>{job.shipper.user.name}</div>
            <div className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
              {job.shipper.user.phone}
              {job.shipper.companyName ? ` · ${job.shipper.companyName}` : ""}
            </div>
          </div>
        </div>
      </DetailBlock>

      {/* Bids */}
      <DetailBlock label={`Bids (${job.bids.length})`}>
        {job.bids.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No bids yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {job.bids.map((bid) => (
              <div key={bid.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, padding: "10px 12px",
                background: "var(--color-raised)", borderRadius: 8,
                border: bid.status === "ACCEPTED" ? "1px solid var(--color-success)" : "1px solid transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar name={bid.driver.user.name} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{bid.driver.user.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      {bid.driver.truckMake} {bid.driver.truckModel} · {bid.driver.capacityTonnes}t · {bid.driver.truckRegistration}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                    ${Number(bid.offeredPrice).toFixed(2)}
                  </div>
                  <Badge tone={bidStatusTone(bid.status)}>{bid.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailBlock>

      {/* Delivery */}
      {job.delivery && (
        <DetailBlock label="Delivery">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <DetailField label="Pickup confirmed" value={fmtDate(job.delivery.pickupConfirmedAt)} mono />
            <DetailField label="Delivered" value={fmtDate(job.delivery.deliveredAt)} mono />
            <DetailField label="Recipient" value={job.delivery.recipientName ?? "—"} />
          </div>
        </DetailBlock>
      )}

      {/* Ratings */}
      {job.ratings.length > 0 && (
        <DetailBlock label="Ratings">
          {job.ratings.map((r) => (
            <div key={r.id} style={{ fontSize: 13, marginBottom: 6 }}>
              <span className="mono" style={{ fontWeight: 600 }}>{r.score}★</span>
              {" "}from {r.fromUser.name} to {r.toUser.name}
              {r.comment ? <span style={{ color: "var(--color-text-secondary)" }}> — “{r.comment}”</span> : null}
            </div>
          ))}
        </DetailBlock>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 2 }}>
        {label}
      </div>
      <div className={mono ? "mono" : ""} style={{ fontSize: 13, color: "var(--color-text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function bidStatusTone(status: string): "green" | "red" | "amber" | "blue" | "gray" {
  if (status === "ACCEPTED") return "green";
  if (status === "REJECTED" || status === "EXPIRED") return "red";
  if (status === "COUNTERED") return "amber";
  if (status === "PENDING") return "blue";
  return "gray";
}
