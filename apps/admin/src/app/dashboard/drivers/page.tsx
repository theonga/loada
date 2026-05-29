"use client";
import { useEffect, useState, useCallback } from "react";
import { api, DriverRecord } from "@/lib/api";
import {
  PageHead, SearchInput, Select, Badge, Check, Avatar, Modal, Pager,
  LoadingRow, EmptyRow, docBadge,
} from "@/components/ui";

const LIMIT = 25;

type DocModalState = {
  driver: DriverRecord;
  rejectFlow: boolean;
  rejectReason: string;
};

export default function DriversPage() {
  const [drivers,    setDrivers]    = useState<DriverRecord[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState("");
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
      if (docStatus) params.documentStatus = docStatus;
      const d = await api.getDrivers(params);
      // Client-side search filter — API search not yet wired
      const q = search.trim().toLowerCase();
      const filtered = q
        ? d.drivers.filter((x) =>
            x.user.name.toLowerCase().includes(q) ||
            x.user.phone.includes(q) ||
            x.truckRegistration.toLowerCase().includes(q),
          )
        : d.drivers;
      setDrivers(filtered);
      setTotal(q ? filtered.length : d.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, docStatus, search]);

  useEffect(() => { load(); }, [load]);

  const selectablePending = drivers.filter((d) =>
    d.documentStatus === "PENDING" || d.documentStatus === "UNDER_REVIEW",
  );
  const allSelected  = selectablePending.length > 0 && selectablePending.every((d) => selected.has(d.id));
  const someSelected = selected.size > 0;

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectablePending.map((d) => d.id)));

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

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
      setDrivers((prev) => prev.map((d) =>
        d.id === driverId ? { ...d, documentStatus: "APPROVED" } : d,
      ));
      if (docModal?.driver.id === driverId) {
        setDocModal((m) => m ? { ...m, driver: { ...m.driver, documentStatus: "APPROVED" } } : null);
      }
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  async function doReject(driverId: string, reason: string) {
    setActionId(driverId);
    try {
      await api.rejectDocs(driverId, reason);
      setDrivers((prev) => prev.map((d) =>
        d.id === driverId ? { ...d, documentStatus: "REJECTED" } : d,
      ));
      if (docModal?.driver.id === driverId) {
        setDocModal((m) => m
          ? { ...m, driver: { ...m.driver, documentStatus: "REJECTED" }, rejectFlow: false, rejectReason: "" }
          : null);
      }
    } catch (e) { setError((e as Error).message); }
    finally { setActionId(null); }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  function balanceColor(_status: string): string {
    return "var(--color-text-primary)";
  }
  void balanceColor;

  return (
    <div>
      <PageHead
        eyebrow="Operations"
        title="Drivers"
        sub="Document verification and driver management"
      />

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by name, phone or registration…"
        />
        <Select
          value={docStatus}
          onChange={(v) => { setDocStatus(v); setPage(1); }}
          style={{ width: 190 }}
        >
          <option value="">All documents</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
        </Select>
      </div>

      {someSelected && (
        <div className="bulkbar">
          <span><span className="count">{selected.size}</span> selected</span>
          <div className="grow" />
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn success sm" onClick={() => setBulkModal("approve")}>Approve docs</button>
          <button className="btn danger sm"  onClick={() => setBulkModal("reject")}>Reject docs</button>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="table-scroll">
        <table className="t">
          <thead>
            <tr>
              <th style={{ width: 38 }}>
                <Check on={allSelected} onClick={toggleAll} label="select all" />
              </th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Capacity</th>
              <th>Doc status</th>
              <th>Online</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={7} />
            ) : drivers.length === 0 ? (
              <EmptyRow
                colSpan={7}
                icon={
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="5" width="13" height="11" rx="2" />
                    <path d="M14 9h3.5L21 13v4h-7V9z" />
                    <circle cx="5" cy="18" r="2" />
                    <circle cx="16" cy="18" r="2" />
                  </svg>
                }
                message="No drivers found"
              />
            ) : drivers.map((d) => {
              const b = docBadge(d.documentStatus);
              const canSelect = d.documentStatus === "PENDING" || d.documentStatus === "UNDER_REVIEW";
              return (
                <tr key={d.id} className={selected.has(d.id) ? "selected" : ""}>
                  <td>
                    {canSelect
                      ? <Check on={selected.has(d.id)} onClick={() => toggleOne(d.id)} label={`select ${d.user.name}`} />
                      : <span style={{ display: "inline-block", width: 16 }} />}
                  </td>
                  <td>
                    <div className="user-cell">
                      <Avatar name={d.user.name} size="sm" />
                      <div>
                        <div className="name">{d.user.name}</div>
                        <div className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                          {d.user.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {d.truckMake} {d.truckModel}{d.truckYear ? ` (${d.truckYear})` : ""}
                    </div>
                    <div className="mono" style={{ color: "var(--color-text-muted)", fontSize: 12, marginTop: 2 }}>
                      {d.truckRegistration}
                    </div>
                  </td>
                  <td className="mono">{d.capacityTonnes}t</td>
                  <td><Badge tone={b.tone}>{b.label}</Badge></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          width: 7, height: 7, borderRadius: "50%",
                          background: d.isOnline ? "var(--color-success)" : "var(--color-border)",
                          boxShadow: d.isOnline ? "0 0 6px rgba(52,211,153,0.5)" : "none",
                        }}
                      />
                      <span style={{
                        fontSize: 13, fontWeight: 500,
                        color: d.isOnline ? "var(--color-success)" : "var(--color-text-muted)",
                      }}>
                        {d.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className={canSelect ? "btn ghost sm" : "btn ghost sm"}
                        onClick={() => setDocModal({ driver: d, rejectFlow: false, rejectReason: "" })}
                      >
                        Review docs
                      </button>
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
        unit="drivers"
      />

      {/* Bulk modals */}
      <Modal
        open={bulkModal === "approve"}
        onClose={() => setBulkModal(null)}
      >
        <h3>Approve documents</h3>
        <p className="body">
          Approve <span className="mono" style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{selected.size}</span> drivers' documents?
          They will be able to start bidding on jobs immediately.
        </p>
        <div className="actions">
          <button className="btn ghost" onClick={() => setBulkModal(null)}>Cancel</button>
          <button className="btn primary" onClick={doBulk} disabled={bulkWorking}>
            {bulkWorking ? "Working…" : "Approve"}
          </button>
        </div>
      </Modal>

      <Modal
        open={bulkModal === "reject"}
        onClose={() => { setBulkModal(null); setBulkReason(""); }}
      >
        <h3>Reject documents</h3>
        <p className="body">
          Reject <span className="mono" style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{selected.size}</span> drivers' documents. The reason will be sent to each driver.
        </p>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Reason <span style={{ color: "var(--color-danger)" }}>*</span></label>
          <textarea
            className="input"
            placeholder="e.g. Photos are blurry — please re-upload in good lighting"
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
          />
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => { setBulkModal(null); setBulkReason(""); }}>Cancel</button>
          <button className="btn danger" onClick={doBulk} disabled={bulkWorking || !bulkReason.trim()}>
            {bulkWorking ? "Working…" : "Confirm rejection"}
          </button>
        </div>
      </Modal>

      {/* Document review modal */}
      <Modal
        open={!!docModal}
        onClose={() => setDocModal(null)}
        wide
      >
        {docModal && (() => {
          const d = docModal.driver;
          const docs = [
            { label: "Driver Licence",        url: d.licenceUrl,        expiry: d.licenceExpiry },
            { label: "Vehicle Registration",  url: d.registrationUrl,   expiry: d.registrationExpiry },
            { label: "Truck Photo",           url: d.truckPhotoUrl,     expiry: null },
          ];
          const badge = docBadge(d.documentStatus);
          const busy = actionId === d.id;

          return (
            <>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 6,
                gap: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Avatar name={d.user.name} size="lg" />
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{d.user.name}</h3>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      <span className="mono">{d.user.phone}</span> · {d.truckMake} {d.truckModel}
                      {" · "}
                      <span className="mono">{d.truckRegistration}</span>
                      {" · "}
                      <span className="mono">{d.capacityTonnes}t</span>
                    </div>
                  </div>
                </div>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </div>

              <div className="doc-grid">
                {docs.map((doc) => (
                  <div key={doc.label} className="doc-thumb">
                    {doc.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={doc.url} alt={doc.label} />
                    ) : (
                      <div className="ph">{doc.label.toUpperCase()}</div>
                    )}
                    <div className="meta">
                      <div className="lbl">{doc.label}</div>
                      {doc.expiry ? (
                        <div className="exp">
                          Expires{" "}
                          {new Date(doc.expiry).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </div>
                      ) : doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12, fontWeight: 600,
                            color: "var(--color-accent)",
                            display: "inline-flex", alignItems: "center", gap: 4,
                          }}
                        >
                          Open full size
                          <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v5H2V2h5M13 2h5v5M8 12L18 2" />
                          </svg>
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic" }}>
                          Not uploaded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {docModal.rejectFlow && (
                <div className="field" style={{ marginTop: 6 }}>
                  <label className="label">
                    Rejection reason <span style={{ color: "var(--color-danger)" }}>*</span>
                  </label>
                  <textarea
                    className="input"
                    placeholder="Tell the driver what to fix (e.g. blurry photo, expired licence)…"
                    value={docModal.rejectReason}
                    onChange={(e) =>
                      setDocModal((m) => m ? { ...m, rejectReason: e.target.value } : null)
                    }
                    autoFocus
                  />
                </div>
              )}

              <div className="actions">
                {docModal.rejectFlow ? (
                  <>
                    <button
                      className="btn ghost"
                      onClick={() => setDocModal((m) => m ? { ...m, rejectFlow: false, rejectReason: "" } : null)}
                    >
                      Back
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => doReject(d.id, docModal.rejectReason)}
                      disabled={!docModal.rejectReason.trim() || busy}
                    >
                      {busy ? "Rejecting…" : "Confirm rejection"}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn ghost" onClick={() => setDocModal(null)}>Close</button>
                    {d.documentStatus !== "REJECTED" && (
                      <button
                        className="btn danger"
                        onClick={() => setDocModal((m) => m ? { ...m, rejectFlow: true } : null)}
                      >
                        Reject
                      </button>
                    )}
                    {d.documentStatus !== "APPROVED" && (
                      <button
                        className="btn primary"
                        onClick={() => approve(d.id)}
                        disabled={busy}
                      >
                        {busy ? "Approving…" : "Approve"}
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}
