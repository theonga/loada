/* Screen 6 — Wallets */

const TX_CHIP = {
  DEPOSIT:            (n) => <span className="tx-chip green">+${n.toFixed(2)}</span>,
  COMMISSION_RESERVE: (n) => <span className="tx-chip amber">−${n.toFixed(2)} held</span>,
  COMMISSION_RELEASE: (n) => <span className="tx-chip blue">+${n.toFixed(2)} released</span>,
  COMMISSION_DEDUCT:  (n) => <span className="tx-chip red">−${n.toFixed(2)} fee</span>,
  REFUND:             (n) => <span className="tx-chip green">+${n.toFixed(2)} refund</span>,
};

const Wallets = () => {
  const [list, setList] = React.useState(() => WALLETS.map(w => ({ ...w })));
  const [search, setSearch] = React.useState("");
  const [hoverId, setHoverId] = React.useState(null);
  const [adjustTarget, setAdjustTarget] = React.useState(null);
  const [amountStr, setAmountStr] = React.useState("");
  const [reason, setReason] = React.useState("");

  const filtered = list.filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.phone.includes(search));

  const totalHeld = list.reduce((s, w) => s + w.balance, 0);
  const zeroCount = list.filter(w => w.balance === 0).length;
  const avg = list.length ? totalHeld / list.length : 0;

  const amountNum = parseFloat(amountStr || "0") || 0;
  const newBalance = adjustTarget ? adjustTarget.balance + amountNum : 0;

  const doAdjust = () => {
    if (!reason.trim() || !amountStr) return;
    setList(list.map(w => w.id === adjustTarget.id ? { ...w, balance: +(w.balance + amountNum).toFixed(2) } : w));
    setAdjustTarget(null); setAmountStr(""); setReason("");
  };

  return (
    <div className="main">
      <PageHead eyebrow="Platform" title="Driver Wallets" sub="Wallet balances and transaction history" />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by driver name or phone…" />
      </div>

      <div className="stats-strip">
        <div className="s">
          <div className="lbl">Total funds held</div>
          <div className="val">${totalHeld.toFixed(2)}</div>
        </div>
        <div className="s">
          <div className="lbl">Drivers with $0</div>
          <div className="val red">{zeroCount}</div>
        </div>
        <div className="s">
          <div className="lbl">Average balance</div>
          <div className="val">${avg.toFixed(2)}</div>
        </div>
        <div className="s">
          <div className="lbl">Drivers tracked</div>
          <div className="val">{list.length}</div>
        </div>
      </div>

      <div className="table-scroll">
      <table className="t">
        <thead>
          <tr>
            <th>Driver</th>
            <th>Phone</th>
            <th style={{ textAlign: "right" }}>Balance</th>
            <th style={{ textAlign: "right" }}>Reserved</th>
            <th style={{ textAlign: "right" }}>Available</th>
            <th>Recent transactions</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((w, idx) => {
            const available = +(w.balance - w.reserved).toFixed(2);
            const balColor = w.balance < 10 ? "var(--danger)" : w.balance >= 50 ? "var(--success)" : "var(--text)";
            return (
              <tr key={w.id}
                  className={`${hoverId === w.id || (hoverId == null && idx === 0) ? "hovered" : ""}`}
                  onMouseEnter={() => setHoverId(w.id)}
                  onMouseLeave={() => setHoverId(null)}>
                <td>
                  <div className="user-cell">
                    <Avatar name={w.name} size="sm"/>
                    <div className="name">{w.name}</div>
                  </div>
                </td>
                <td className="mono" style={{ color: "var(--text-2)" }}>{w.phone}</td>
                <td className="mono" style={{ textAlign: "right", color: balColor, fontWeight: 700 }}>${w.balance.toFixed(2)}</td>
                <td className="mono" style={{ textAlign: "right", color: "var(--text-2)" }}>${w.reserved.toFixed(2)}</td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>${available.toFixed(2)}</td>
                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                    {w.txs.filter(t => t.amount > 0).slice(0, 3).map((t, i) => (
                      <React.Fragment key={i}>{TX_CHIP[t.t](t.amount)}</React.Fragment>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn ghost sm" onClick={() => { setAdjustTarget(w); setAmountStr(""); setReason(""); }}>Adjust</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <Modal open={!!adjustTarget} onClose={() => { setAdjustTarget(null); setAmountStr(""); setReason(""); }}>
        {adjustTarget && (
          <>
            <h3>Adjust balance — {adjustTarget.name}</h3>
            <p className="body" style={{ marginBottom: 8 }}>
              Current balance: <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>${adjustTarget.balance.toFixed(2)}</span>
            </p>

            <div className="field">
              <label className="label">Amount (USD) — positive credit, negative debit</label>
              <input
                className="input mono"
                placeholder="e.g. 15.00 or -3.50"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                style={{ fontSize: 20, height: 56, fontWeight: 600, letterSpacing: "-0.01em" }}
              />
              {amountStr !== "" && !isNaN(amountNum) && (
                <div className="balance-pre">
                  Balance: <span>${adjustTarget.balance.toFixed(2)}</span>
                  <span className="arrow">→</span>
                  <span className={`new ${newBalance > adjustTarget.balance ? "up" : newBalance < adjustTarget.balance ? "down" : ""}`}>
                    ${newBalance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Reason <span style={{ color: "var(--danger)" }}>*</span></label>
              <textarea className="input" placeholder="e.g. Manual refund for cancelled job J-2841" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <div className="actions">
              <button className="btn ghost" onClick={() => { setAdjustTarget(null); setAmountStr(""); setReason(""); }}>Cancel</button>
              <button className="btn primary" onClick={doAdjust} disabled={!reason.trim() || amountStr === "" || isNaN(amountNum) || amountNum === 0}>Adjust Balance</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

Object.assign(window, { Wallets });
