/* Chart components — all SVG, no libs */

// ---- AreaChart: dual-series for Jobs (blue) & Commission (amber) ----
const AreaChart = ({ data, w = 600, h = 220 }) => {
  // data: [{ label, jobs, rev }, ...]
  const pad = { l: 40, r: 44, t: 12, b: 28 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const maxJ = Math.max(...data.map(d => d.jobs)) * 1.1;
  const maxR = Math.max(...data.map(d => d.rev)) * 1.1;
  const xs = data.map((_, i) => pad.l + (i / (data.length - 1)) * iw);
  const yJ = (v) => pad.t + ih - (v / maxJ) * ih;
  const yR = (v) => pad.t + ih - (v / maxR) * ih;

  const linePts = (yFn, key) => data.map((d, i) => `${xs[i]},${yFn(d[key])}`).join(" ");
  const areaPts = (yFn, key) => `${pad.l},${pad.t + ih} ${linePts(yFn, key)} ${pad.l + iw},${pad.t + ih}`;

  // Gridlines (4 horizontal)
  const grid = [0.25, 0.5, 0.75, 1].map(f => pad.t + ih - f * ih);

  // X tick labels: first, mid, last (every 5th if many)
  const tickEvery = Math.max(1, Math.floor(data.length / 6));
  const [hover, setHover] = React.useState(null);

  const ref = React.useRef(null);
  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    // scale account
    const sx = (e.clientX - rect.left) * (w / rect.width);
    let nearest = 0; let best = Infinity;
    xs.forEach((x, i) => { const d = Math.abs(x - sx); if (d < best) { best = d; nearest = i; } });
    setHover(nearest);
  };

  return (
    <div className="area-wrap" style={{ position: "relative" }}>
      <svg ref={ref} viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}
           onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f7cff" stopOpacity="0.45"/>
            <stop offset="100%" stopColor="#4f7cff" stopOpacity="0.02"/>
          </linearGradient>
          <linearGradient id="gAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F5A623" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0.02"/>
          </linearGradient>
        </defs>

        {grid.map((y, i) => (
          <line key={i} x1={pad.l} x2={pad.l + iw} y1={y} y2={y} stroke="#242a39" strokeWidth="1" />
        ))}

        {/* Areas */}
        <polygon points={areaPts(yJ, "jobs")} fill="url(#gBlue)" />
        <polyline points={linePts(yJ, "jobs")} fill="none" stroke="#4f7cff" strokeWidth="2" />
        <polygon points={areaPts(yR, "rev")} fill="url(#gAmber)" />
        <polyline points={linePts(yR, "rev")} fill="none" stroke="#F5A623" strokeWidth="2" />

        {/* Y axis labels — jobs (left) */}
        {[0, 0.5, 1].map((f, i) => (
          <text key={i} x={pad.l - 8} y={pad.t + ih - f * ih + 3} textAnchor="end" fill="#737b96" fontSize="10" fontFamily="DM Mono">
            {Math.round(maxJ * f)}
          </text>
        ))}
        {/* Y axis labels — rev (right) */}
        {[0, 0.5, 1].map((f, i) => (
          <text key={i} x={w - pad.r + 8} y={pad.t + ih - f * ih + 3} textAnchor="start" fill="#737b96" fontSize="10" fontFamily="DM Mono">
            ${Math.round(maxR * f)}
          </text>
        ))}

        {/* X axis */}
        {data.map((d, i) => (i % tickEvery === 0 || i === data.length - 1) && (
          <text key={i} x={xs[i]} y={pad.t + ih + 18} textAnchor="middle" fill="#737b96" fontSize="10" fontFamily="DM Mono">
            {d.label}
          </text>
        ))}

        {/* Hover */}
        {hover != null && (
          <g>
            <line x1={xs[hover]} x2={xs[hover]} y1={pad.t} y2={pad.t + ih} stroke="#353c52" strokeDasharray="3 3"/>
            <circle cx={xs[hover]} cy={yJ(data[hover].jobs)} r="4" fill="#0f1117" stroke="#4f7cff" strokeWidth="2"/>
            <circle cx={xs[hover]} cy={yR(data[hover].rev)} r="4" fill="#0f1117" stroke="#F5A623" strokeWidth="2"/>
          </g>
        )}
      </svg>

      {hover != null && (
        <div style={{
          position: "absolute",
          left: `${(xs[hover] / w) * 100}%`,
          top: 8,
          transform: "translateX(-50%)",
          background: "#1e2330",
          border: "1px solid #353c52",
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 12,
          pointerEvents: "none",
          minWidth: 130,
          boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
        }}>
          <div style={{ color: "#a0a8bc", fontSize: 11, marginBottom: 4, fontFamily: "DM Mono" }}>{data[hover].label}</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "#4f7cff" }}>Jobs</span>
            <span className="mono" style={{ fontWeight: 600 }}>{data[hover].jobs}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "#F5A623" }}>Revenue</span>
            <span className="mono" style={{ fontWeight: 600 }}>${data[hover].rev}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Vertical bar chart: Wallet bands ----
const BarChart = ({ data, w = 380, h = 220 }) => {
  // data: [{ label, value, color }]
  const pad = { l: 24, r: 12, t: 14, b: 30 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const max = Math.max(...data.map(d => d.value)) * 1.15;
  const bw = iw / data.length;
  const grid = [0.25, 0.5, 0.75, 1].map(f => pad.t + ih - f * ih);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {grid.map((y, i) => (
        <line key={i} x1={pad.l} x2={pad.l + iw} y1={y} y2={y} stroke="#242a39"/>
      ))}
      {data.map((d, i) => {
        const x = pad.l + i * bw + bw * 0.18;
        const bwI = bw * 0.64;
        const bh = (d.value / max) * ih;
        const y = pad.t + ih - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bwI} height={bh} rx="4" fill={d.color}/>
            <text x={x + bwI / 2} y={y - 6} textAnchor="middle" fill="#e8eaf0" fontSize="11" fontFamily="DM Mono" fontWeight="600">
              {d.value}
            </text>
            <text x={x + bwI / 2} y={pad.t + ih + 18} textAnchor="middle" fill="#a0a8bc" fontSize="11" fontFamily="DM Mono">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ---- Horizontal bar chart: Jobs by status ----
const HBarChart = ({ data, w = 540, h = 260 }) => {
  // data: [{ label, value, color }]
  const pad = { l: 140, r: 30, t: 10, b: 6 };
  const iw = w - pad.l - pad.r;
  const rowH = (h - pad.t - pad.b) / data.length;
  const max = Math.max(...data.map(d => d.value)) * 1.1;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block" }}>
      {data.map((d, i) => {
        const y = pad.t + i * rowH + rowH * 0.18;
        const bh = rowH * 0.64;
        const bw = (d.value / max) * iw;
        return (
          <g key={d.label}>
            <text x={pad.l - 12} y={y + bh / 2 + 4} textAnchor="end" fill="#a0a8bc" fontSize="11" fontFamily="DM Mono">
              {d.label}
            </text>
            <rect x={pad.l} y={y} width={iw} height={bh} rx="4" fill="#1e2330"/>
            <rect x={pad.l} y={y} width={bw} height={bh} rx="4" fill={d.color}/>
            <text x={pad.l + bw + 6} y={y + bh / 2 + 4} fill="#e8eaf0" fontSize="11" fontFamily="DM Mono" fontWeight="600">
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

Object.assign(window, { AreaChart, BarChart, HBarChart });
