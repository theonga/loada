/* Screen 4 — Drivers */

const Drivers = () => {
  const [list, setList] = React.useState(() => DRIVERS.map(d => ({ ...d, licenceExpiry: "2027-08-14", regExpiry: "2026-12-02" })));
  const [search, setSearch] = React.useState("");
  const [docFilter, setDocFilter] = React.useState("ALL");
  const [selected, setSelected] = React.useState(new Set());
  const [hoverId, setHoverId] = React.useState(null);
  const [reviewTarget, setReviewTarget] = React.useState(null);
  const [rejectMode, setRejectMode] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [bulkOpen, setBulkOpen] = React.useState(null); // "approve" | "reject"
  const [bulkReason, setBulkReason] = React.useState("");

  const filtered = list.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search);
    const matchFilter = docFilter === "ALL" || d.docStatus === docFilter;
    return matchSearch && matchFilter;
  });

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(d => d.id)));
  };

  const selectedHasPending = list
    .filter(d => selected.has(d.id))
    .some(d => d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW");

  const setStatus = (id, status) => setList(list.map(d => d.id === id ? { ...d, docStatus: status } : d));

  const approve = () => { setStatus(reviewTarget.id, "APPROVED"); setReviewTarget(null); setRejectMode(false); };
  const rejectConfirm = () => {
    if (!rejectReason.trim()) return;
    setStatus(reviewTarget.id, "REJECTED");
    setReviewTarget(null); setRejectMode(false); setRejectReason("");
  };

  const bulkApprove = () => {
    setList(list.map(d => selected.has(d.id) && (d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW") ? { ...d, docStatus: "APPROVED" } : d));
    setSelected(new Set()); setBulkOpen(null);
  };
  const bulkReject = () => {
    if (!bulkReason.trim()) return;
    setList(list.map(d => selected.has(d.id) && (d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW") ? { ...d, docStatus: "REJECTED" } : d));
    setSelected(new Set()); setBulkOpen(null); setBulkReason("");
  };

  return (
    <div className="main">
      <PageHead eyebrow="Operations" title="Drivers" sub="Document verification and driver management" />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone…" />
        <Select value={docFilter} onChange={setDocFilter} style={{ width: 190 }}>
          <option value="ALL">All documents</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="bulkbar">
          <span><span className="count">{selected.size}</span> selected</span>
          <div className="grow"/>
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn success sm" disabled={!selectedHasPending} onClick={() => setBulkOpen("approve")}>Approve docs</button>
          <button className="btn danger sm"  disabled={!selectedHasPending} onClick={() => setBulkOpen("reject")}>Reject docs</button>
        </div>
      )}

      <div className="table-scroll">
      <table className="t">
        <thead>
          <tr>
            <th style={{ width: 38 }}>
              <Check on={selected.size > 0 && selected.size === filtered.length} onClick={toggleAll}/>
            </th>
            <th>Driver</th>
            <th>Phone</th>
            <th>Capacity</th>
            <th>Truck</th>
            <th>Doc status</th>
            <th style={{ textAlign: "right" }}>Wallet</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((d, idx) => {
            const b = docBadge(d.docStatus);
            const balColor = d.balance < 10 ? "var(--danger)" : d.balance >= 50 ? "var(--success)" : "var(--text)";
            return (
              <tr key={d.id}
                  className={`${selected.has(d.id) ? "selected" : ""} ${hoverId === d.id || (hoverId == null && idx === 1) ? "hovered" : ""}`}
                  onMouseEnter={() => setHoverId(d.id)}
                  onMouseLeave={() => setHoverId(null)}>
                <td><Check on={selected.has(d.id)} onClick={() => toggle(d.id)} /></td>
                <td>
                  <div className="user-cell">
                    <Avatar name={d.name} size="sm"/>
                    <div className="name">{d.name}</div>
                  </div>
                </td>
                <td className="mono" style={{ color: "var(--text-2)" }}>{d.phone}</td>
                <td className="mono">{d.capacity}</td>
                <td style={{ color: "var(--text-2)" }}>{d.truck}</td>
                <td><Badge tone={b.tone}>{b.label}</Badge></td>
                <td className="mono" style={{ textAlign: "right", color: balColor, fontWeight: 600 }}>${d.balance.toFixed(2)}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn ghost sm" onClick={() => { setReviewTarget(d); setRejectMode(false); setRejectReason(""); }}>
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

      {/* Doc review modal */}
      <Modal open={!!reviewTarget} onClose={() => { setReviewTarget(null); setRejectMode(false); setRejectReason(""); }} wide>
        {reviewTarget && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 16 }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{reviewTarget.name}</h3>
                <div className="mono" style={{ color: "var(--text-3)", fontSize: 12 }}>
                  {reviewTarget.truck} · Reg ZW-{reviewTarget.id.toUpperCase()}-{Math.floor(Math.random() * 9000) + 1000 || 4521}
                </div>
              </div>
              <Badge tone={docBadge(reviewTarget.docStatus).tone}>{docBadge(reviewTarget.docStatus).label}</Badge>
            </div>

            <div className="doc-grid">
              <div className="doc-thumb">
                <div className="ph">DRIVER LICENCE</div>
                <div className="meta">
                  <div className="lbl">Expires</div>
                  <div className="exp">{reviewTarget.licenceExpiry}</div>
                </div>
              </div>
              <div className="doc-thumb">
                <div className="ph">TRUCK REGISTRATION</div>
                <div className="meta">
                  <div className="lbl">Expires</div>
                  <div className="exp">{reviewTarget.regExpiry}</div>
                </div>
              </div>
            </div>

            {rejectMode && (
              <div className="field" style={{ marginTop: 6 }}>
                <label className="label">Rejection reason <span style={{ color: "var(--danger)" }}>*</span></label>
                <textarea className="input" placeholder="Tell the driver what to fix (e.g. blurry photo, expired licence)…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              </div>
            )}

            <div className="actions">
              {(reviewTarget.docStatus === "PENDING" || reviewTarget.docStatus === "UNDER_REVIEW") && !rejectMode && (
                <>
                  <button className="btn ghost" onClick={() => setReviewTarget(null)}>Cancel</button>
                  <button className="btn danger" onClick={() => setRejectMode(true)}>Reject</button>
                  <button className="btn primary" onClick={approve}>Approve</button>
                </>
              )}
              {rejectMode && (
                <>
                  <button className="btn ghost" onClick={() => { setRejectMode(false); setRejectReason(""); }}>Back</button>
                  <button className="btn danger" onClick={rejectConfirm} disabled={!rejectReason.trim()}>Confirm rejection</button>
                </>
              )}
              {(reviewTarget.docStatus === "APPROVED" || reviewTarget.docStatus === "REJECTED") && !rejectMode && (
                <>
                  <button className="btn ghost" onClick={() => setReviewTarget(null)}>Close</button>
                  <button className="btn primary" onClick={() => setStatus(reviewTarget.id, "UNDER_REVIEW") || setReviewTarget(null)}>Re-open for review</button>
                </>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Bulk approve modal */}
      <Modal open={bulkOpen === "approve"} onClose={() => setBulkOpen(null)}>
        <h3>Approve documents</h3>
        <p className="body">Approve <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>{Array.from(selected).filter(id => { const d = list.find(x => x.id === id); return d && (d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW"); }).length}</span> drivers' documents? They will be able to start bidding on jobs immediately.</p>
        <div className="actions">
          <button className="btn ghost" onClick={() => setBulkOpen(null)}>Cancel</button>
          <button className="btn primary" onClick={bulkApprove}>Approve</button>
        </div>
      </Modal>

      {/* Bulk reject modal */}
      <Modal open={bulkOpen === "reject"} onClose={() => { setBulkOpen(null); setBulkReason(""); }}>
        <h3>Reject documents</h3>
        <p className="body">Reject <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>{Array.from(selected).filter(id => { const d = list.find(x => x.id === id); return d && (d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW"); }).length}</span> drivers' documents. The reason will be sent to each driver.</p>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Reason <span style={{ color: "var(--danger)" }}>*</span></label>
          <textarea className="input" placeholder="e.g. Photos are blurry — please re-upload in good lighting" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} />
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => { setBulkOpen(null); setBulkReason(""); }}>Cancel</button>
          <button className="btn danger" onClick={bulkReject} disabled={!bulkReason.trim()}>Confirm rejection</button>
        </div>
      </Modal>
    </div>
  );
};

Object.assign(window, { Drivers });
