/* Overview (Dashboard) */

const RANGE_DAYS = { "7": 7, "30": 30, "90": 90 };

// Synthetic timeseries for the area chart
const buildSeries = (days) => {
  const arr = [];
  const seed = days * 11;
  for (let i = 0; i < days; i++) {
    const t = i / Math.max(1, days - 1);
    const wave = Math.sin((i + seed) / 4) * 0.4 + Math.cos((i + seed * 0.7) / 7) * 0.3;
    const jobs = Math.round(28 + 16 * t + 14 * wave + (i % 5 === 0 ? 6 : 0));
    const rev = Math.round(jobs * (12 + 4 * wave + t * 2));
    const d = new Date(2026, 4, 28); // May 28, 2026
    d.setDate(d.getDate() - (days - 1 - i));
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    arr.push({ label, jobs: Math.max(8, jobs), rev: Math.max(40, rev) });
  }
  return arr;
};

const Overview = () => {
  const [range, setRange] = React.useState("30");
  const [customOpen, setCustomOpen] = React.useState(false);
  const [from, setFrom] = React.useState("2026-04-28");
  const [to, setTo] = React.useState("2026-05-28");

  const series = React.useMemo(() => buildSeries(RANGE_DAYS[range] || 30), [range]);

  const walletBands = [
    { label: "$0",        value: 18, color: "#3d5cae" },
    { label: "$0.01–$9",  value: 27, color: "#4f7cff" },
    { label: "$10–$49",   value: 41, color: "#6b91ff" },
    { label: "$50+",      value: 23, color: "#8fa9ff" },
  ];

  const jobsByStatus = [
    { label: "POSTED",            value: 14, color: "#4f7cff" },
    { label: "BIDDING",           value: 22, color: "#4f7cff" },
    { label: "RADIUS_EXPANDED",   value: 6,  color: "#4f7cff" },
    { label: "MATCHED",           value: 11, color: "#F5A623" },
    { label: "IN_TRANSIT",        value: 19, color: "#F5A623" },
    { label: "COMPLETED",         value: 142,color: "#34d399" },
    { label: "CANCELLED",         value: 9,  color: "#f87171" },
  ];

  return (
    <div className="main">
      <PageHead eyebrow="Operations" title="Overview" sub="Platform health at a glance" />

      {/* KPI strip */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="lbl">Total Users</div>
          <div className="val">1,284</div>
          <div className="sub"><span className="mono">847</span> drivers · <span className="mono">437</span> shippers</div>
        </div>
        <div className="kpi">
          <div className="lbl">Commission This Month</div>
          <div className="val amber">$3,742.50</div>
          <div className="sub">from <span className="mono">186</span> completed jobs</div>
        </div>
        <div className="kpi">
          <div className="lbl">Total Jobs</div>
          <div className="val">2,193</div>
          <div className="sub"><span className="mono">72</span> active now</div>
        </div>
        <div className="kpi">
          <div className="lbl">Completed Today</div>
          <div className="val green">38</div>
          <div className="sub">↑ <span className="mono">12%</span> vs. yesterday</div>
        </div>
        <div className="kpi">
          <div className="lbl">Wallet Funds Held</div>
          <div className="val blue">$8,914.20</div>
          <div className="sub"><span className="mono">$47,210</span> earned all-time</div>
        </div>
      </div>

      {/* Range toolbar */}
      <div className="toolbar" style={{ marginTop: 18, marginBottom: 6 }}>
        <div className="pill-row">
          {["7","30","90"].map(d => (
            <button key={d} className={`pill ${range === d && !customOpen ? "on" : ""}`} onClick={() => { setRange(d); setCustomOpen(false); }}>
              Last {d} days
            </button>
          ))}
          <button className={`pill ${customOpen ? "on" : ""}`} onClick={() => setCustomOpen(o => !o)}>Custom range</button>
        </div>
        {customOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 170, height: 38 }}/>
            <span style={{ color: "#737b96" }}>→</span>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 170, height: 38 }}/>
          </div>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="charts-row r1">
        <div className="chart-card">
          <div className="chart-head">
            <div>
              <div className="chart-title">Jobs &amp; Revenue</div>
              <div className="chart-sub">{customOpen ? `${from} → ${to}` : `Last ${range} days`}</div>
            </div>
            <div className="legend">
              <span className="sw"><span className="swatch" style={{ background: "#4f7cff" }}/>Jobs</span>
              <span className="sw"><span className="swatch" style={{ background: "#F5A623" }}/>Commission (USD)</span>
            </div>
          </div>
          <AreaChart data={series} />
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <div>
              <div className="chart-title">Driver Wallet Balances</div>
              <div className="chart-sub">Wallet balance distribution · 109 drivers</div>
            </div>
          </div>
          <BarChart data={walletBands} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="charts-row r2" style={{ marginTop: 16 }}>
        <div className="chart-card">
          <div className="chart-head">
            <div>
              <div className="chart-title">Jobs by Status</div>
              <div className="chart-sub">Current snapshot</div>
            </div>
            <div className="legend">
              <span className="sw"><span className="swatch" style={{ background: "#4f7cff" }}/>Active</span>
              <span className="sw"><span className="swatch" style={{ background: "#F5A623" }}/>In progress</span>
              <span className="sw"><span className="swatch" style={{ background: "#34d399" }}/>Complete</span>
              <span className="sw"><span className="swatch" style={{ background: "#f87171" }}/>Cancelled</span>
            </div>
          </div>
          <HBarChart data={jobsByStatus} />
        </div>

        <div className="chart-card">
          <div className="chart-head">
            <div>
              <div className="chart-title">Platform Activity</div>
              <div className="chart-sub">This week</div>
            </div>
          </div>
          <div className="stat-grid">
            <div>
              <div className="s-lbl">New drivers</div>
              <div className="s-val">17</div>
            </div>
            <div>
              <div className="s-lbl">Jobs posted</div>
              <div className="s-val">218</div>
            </div>
            <div>
              <div className="s-lbl">Avg bids / job</div>
              <div className="s-val">3.4</div>
            </div>
            <div>
              <div className="s-lbl">Avg completion</div>
              <div className="s-val">6.2<span style={{ fontSize: 14, color: "#737b96", marginLeft: 4 }}>h</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { Overview });
