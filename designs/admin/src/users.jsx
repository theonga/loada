/* Screen 3 — Users */

const Users = () => {
  const [list, setList] = React.useState(() => USERS.map(u => ({ ...u })));
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [selected, setSelected] = React.useState(new Set());
  const [hoverId, setHoverId] = React.useState(null);
  const [suspendTarget, setSuspendTarget] = React.useState(null);
  const [suspendReason, setSuspendReason] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 8;

  const filtered = list.filter(u => {
    const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === pageData.length) setSelected(new Set());
    else setSelected(new Set(pageData.map(u => u.id)));
  };

  const doSuspend = () => {
    if (!suspendReason.trim()) return;
    setList(list.map(u => u.id === suspendTarget.id ? { ...u, status: "SUSPENDED" } : u));
    setSuspendTarget(null);
    setSuspendReason("");
  };

  const doUnsuspend = (id) => {
    setList(list.map(u => u.id === id ? { ...u, status: "ACTIVE" } : u));
  };

  const bulkSuspend = () => {
    setList(list.map(u => selected.has(u.id) ? { ...u, status: "SUSPENDED" } : u));
    setSelected(new Set());
  };

  return (
    <div className="main">
      <PageHead eyebrow="Operations" title="Users" sub="All registered accounts" />

      <div className="toolbar">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or phone…" />
        <Select value={roleFilter} onChange={(v) => { setRoleFilter(v); setPage(1); }} style={{ width: 170 }}>
          <option value="ALL">All roles</option>
          <option value="DRIVER">Drivers</option>
          <option value="SHIPPER">Shippers</option>
          <option value="BOTH">Both</option>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="bulkbar">
          <span><span className="count">{selected.size}</span> selected</span>
          <div className="grow"/>
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn danger sm" onClick={bulkSuspend}>Suspend selected</button>
        </div>
      )}

      <div className="table-scroll">
      <table className="t">
        <thead>
          <tr>
            <th style={{ width: 38 }}>
              <Check on={selected.size > 0 && selected.size === pageData.length} onClick={toggleAll} label="select all" />
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
          {pageData.map((u, idx) => {
            const r = roleBadge(u.role);
            return (
              <tr
                key={u.id}
                className={`${selected.has(u.id) ? "selected" : ""} ${hoverId === u.id || (hoverId == null && idx === 1) ? "hovered" : ""}`}
                onMouseEnter={() => setHoverId(u.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                <td><Check on={selected.has(u.id)} onClick={() => toggle(u.id)} label={`select ${u.name}`} /></td>
                <td>
                  <div className="user-cell">
                    <Avatar name={u.name} size="sm"/>
                    <div className="name">{u.name}</div>
                  </div>
                </td>
                <td className="mono" style={{ color: "var(--text-2)" }}>{u.phone}</td>
                <td><Badge tone={r.tone}>{r.label}</Badge></td>
                <td>
                  {u.status === "ACTIVE"
                    ? <Badge tone="green" dot>ACTIVE</Badge>
                    : <Badge tone="red"   dot>SUSPENDED</Badge>}
                </td>
                <td className="mono" style={{ color: "var(--text-2)" }}>{u.joined}</td>
                <td>
                  <div className="row-actions">
                    {u.status === "ACTIVE"
                      ? <button className="btn danger sm" onClick={() => setSuspendTarget(u)}>Suspend</button>
                      : <button className="btn ghost sm" onClick={() => doUnsuspend(u.id)}>Unsuspend</button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <Pager page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} />

      <Modal open={!!suspendTarget} onClose={() => { setSuspendTarget(null); setSuspendReason(""); }}>
        {suspendTarget && (
          <>
            <h3>Suspend {suspendTarget.name}</h3>
            <p className="body">
              Suspended accounts lose platform access immediately. {suspendTarget.role === "DRIVER" && "Drivers cannot bid on new jobs."}
              {suspendTarget.role === "SHIPPER" && "Shippers cannot post new jobs."}
              {suspendTarget.role === "BOTH" && "They will lose both bidding and posting privileges."}
              {" "}Active bids and jobs are not affected.
            </p>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Reason <span style={{ color: "var(--danger)" }}>*</span></label>
              <textarea className="input" placeholder="Explain why this account is being suspended…" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
            </div>
            <div className="actions">
              <button className="btn ghost" onClick={() => { setSuspendTarget(null); setSuspendReason(""); }}>Cancel</button>
              <button className="btn danger" onClick={doSuspend} disabled={!suspendReason.trim()}>Suspend account</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

Object.assign(window, { Users });
