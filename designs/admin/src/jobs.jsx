/* Screen 5 — Jobs */

const CANCELLABLE = new Set(["POSTED","BIDDING","RADIUS_EXPANDED","MATCHED","PICKUP_EN_ROUTE","PICKUP_ARRIVED","LOADED","IN_TRANSIT"]);

const JOB_STATUSES = ["POSTED","BIDDING","RADIUS_EXPANDED","MATCHED","PICKUP_EN_ROUTE","PICKUP_ARRIVED","LOADED","IN_TRANSIT","COMPLETED","DELIVERED","CANCELLED","DISPUTED"];

const Jobs = () => {
  const [list, setList] = React.useState(() => JOBS.map(j => ({ ...j })));
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [selected, setSelected] = React.useState(new Set());
  const [hoverId, setHoverId] = React.useState(null);
  const [forceOpen, setForceOpen] = React.useState(false);
  const [forceReason, setForceReason] = React.useState("");
  const [singleCancelTarget, setSingleCancelTarget] = React.useState(null);

  const filtered = list.filter(j => {
    const matchSearch = !search
      || j.id.toLowerCase().includes(search.toLowerCase())
      || j.origin.toLowerCase().includes(search.toLowerCase())
      || j.dest.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const cancellableSelected = list.filter(j => selected.has(j.id) && CANCELLABLE.has(j.status));

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(j => j.id)));
  };

  const doForceCancel = () => {
    if (!forceReason.trim()) return;
    const ids = singleCancelTarget ? new Set([singleCancelTarget.id]) : new Set(cancellableSelected.map(j => j.id));
    setList(list.map(j => ids.has(j.id) ? { ...j, status: "CANCELLED" } : j));
    setForceOpen(false); setForceReason(""); setSingleCancelTarget(null); setSelected(new Set());
  };

  return (
    <div className="main">
      <PageHead eyebrow="Operations" title="Jobs" sub="All loads posted on the platform" />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by job ID, origin or destination…" />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 220 }}>
          <option value="ALL">All statuses</option>
          {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="bulkbar">
          <span><span className="count">{selected.size}</span> selected · <span className="mono">{cancellableSelected.length}</span> cancellable</span>
          <div className="grow"/>
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn danger sm" disabled={!cancellableSelected.length} onClick={() => setForceOpen(true)}>Force cancel</button>
        </div>
      )}

      <div className="table-scroll">
      <table className="t">
        <thead>
          <tr>
            <th style={{ width: 38 }}>
              <Check on={selected.size > 0 && selected.size === filtered.length} onClick={toggleAll}/>
            </th>
            <th>Route</th>
            <th>Cargo</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th>Status</th>
            <th>Shipper</th>
            <th>Driver</th>
            <th>Posted</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((j, idx) => (
            <tr key={j.id}
                className={`${selected.has(j.id) ? "selected" : ""} ${hoverId === j.id || (hoverId == null && idx === 1) ? "hovered" : ""}`}
                onMouseEnter={() => setHoverId(j.id)}
                onMouseLeave={() => setHoverId(null)}>
              <td><Check on={selected.has(j.id)} onClick={() => toggle(j.id)} /></td>
              <td>
                <div className="route-cell">
                  <div className="from truncate">{j.origin}</div>
                  <div className="to truncate"><IconArrowRight size={11}/> {j.dest}</div>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 500 }}>{j.cargo}</div>
                <div className="mono" style={{ color: "var(--text-3)", fontSize: 12 }}>{j.tonnes}</div>
              </td>
              <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>${j.price.toFixed(2)}</td>
              <td><Badge tone={statusBadge(j.status)}>{j.status.replace(/_/g, " ")}</Badge></td>
              <td style={{ color: "var(--text-2)" }} className="truncate">{j.shipper}</td>
              <td className={j.driver ? "" : "mono"} style={{ color: j.driver ? "var(--text)" : "var(--text-3)" }}>{j.driver || "—"}</td>
              <td className="mono" style={{ color: "var(--text-2)" }}>{j.posted}</td>
              <td>
                <div className="row-actions">
                  {CANCELLABLE.has(j.status)
                    ? <button className="btn danger sm" onClick={() => { setSingleCancelTarget(j); setForceOpen(true); }}>Cancel</button>
                    : <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Pager page={1} totalPages={1} total={filtered.length} perPage={filtered.length} onPage={() => {}} />

      <Modal open={forceOpen} onClose={() => { setForceOpen(false); setForceReason(""); setSingleCancelTarget(null); }}>
        <h3>Cancel {singleCancelTarget ? "this job" : `${cancellableSelected.length} jobs`}?</h3>
        <p className="body">
          This action is irreversible. {singleCancelTarget ? "The driver and shipper" : "All affected drivers and shippers"} will be notified, and any reserved commission will be refunded.
        </p>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Reason <span style={{ color: "var(--danger)" }}>*</span></label>
          <textarea className="input" placeholder="Why are you force-cancelling?" value={forceReason} onChange={(e) => setForceReason(e.target.value)} />
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => { setForceOpen(false); setForceReason(""); setSingleCancelTarget(null); }}>Cancel</button>
          <button className="btn danger" onClick={doForceCancel} disabled={!forceReason.trim()}>Force Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

Object.assign(window, { Jobs });
