"use client";
import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { api, AdminStats, AnalyticsData } from "@/lib/api";
import { PageHead } from "@/components/ui";

// ── Chart palette (matches the design tokens) ────────────────────────

const C = {
  accent:  "#4f7cff",
  green:   "#34d399",
  red:     "#f87171",
  purple:  "#a78bfa",
  cyan:    "#22d3ee",
  amber:   "#F5A623",
  divider: "#2a2f3e",
  text2:   "#a0a8bc",
  text3:   "#737b96",
};

const tooltipStyle = {
  contentStyle: {
    background: "#1e2330",
    border: "1px solid #2a2f3e",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "DM Sans, ui-sans-serif",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: C.text2, marginBottom: 6, fontWeight: 600 },
  itemStyle:  { color: "#e8eaf0" },
  cursor:     { fill: "rgba(255,255,255,0.025)" },
};

// ── Date range helper ────────────────────────────────────────────────

type Preset = "7d" | "30d" | "90d" | "custom";

function presetRange(p: Preset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (p === "7d")  from.setDate(to.getDate() - 7);
  if (p === "30d") from.setDate(to.getDate() - 30);
  if (p === "90d") from.setDate(to.getDate() - 90);
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  };
}

function fmtDate(s: string) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ── KPI sub-component ────────────────────────────────────────────────

function Kpi({
  label, value, sub, accent,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent?: "blue" | "green" | "amber" | "red";
}) {
  return (
    <div className="kpi">
      <div className="lbl">{label}</div>
      <div className={`val${accent ? ` ${accent}` : ""}`}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="kpi">
      <div className="lbl" style={{ background: "var(--color-raised)", borderRadius: 4, color: "transparent", width: 80 }}>·</div>
      <div className="val" style={{ background: "var(--color-raised)", borderRadius: 6, color: "transparent" }}>·</div>
      <div className="sub" style={{ background: "var(--color-raised)", borderRadius: 4, color: "transparent", width: 100 }}>·</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

type ChartTab = "jobs" | "revenue" | "users";

export default function DashboardPage() {
  const [stats,     setStats]     = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [preset,    setPreset]    = useState<Preset>("30d");
  const [from,      setFrom]      = useState(presetRange("30d").from);
  const [to,        setTo]        = useState(presetRange("30d").to);
  const [gran,      setGran]      = useState<"day" | "week" | "month">("day");
  const [chartTab,  setChartTab]  = useState<ChartTab>("jobs");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [mounted,   setMounted]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, a] = await Promise.all([
        api.getStats().then((d) => d.stats),
        api.getAnalytics({ from: from + "T00:00:00.000Z", to: to + "T23:59:59.999Z", granularity: gran }),
      ]);
      setStats(s);
      setAnalytics(a);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [from, to, gran]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { load(); }, [load]);

  function applyPreset(p: Preset) {
    setPreset(p);
    if (p !== "custom") {
      const r = presetRange(p);
      setFrom(r.from);
      setTo(r.to);
    }
  }

  // Series for the active tab
  const seriesData: Record<string, unknown>[] = (() => {
    if (!analytics) return [];
    if (chartTab === "jobs")    return analytics.series.jobs.map((r) => ({ label: fmtDate(r.date), created: r.created, completed: r.completed }));
    if (chartTab === "revenue") return analytics.series.revenue.map((r) => ({ label: fmtDate(r.date), amount: r.amount }));
    return analytics.series.users.map((r) => ({ label: fmtDate(r.date), newUsers: r.newUsers }));
  })();

  const jobStatusData = analytics
    ? Object.entries(analytics.breakdown.jobsByStatus ?? {}).map(([name, value]) => ({
        name,
        value,
        color: {
          POSTED: C.accent, BIDDING: C.accent, RADIUS_EXPANDED: C.accent,
          MATCHED: C.amber, IN_TRANSIT: C.amber, PICKUP_EN_ROUTE: C.amber, PICKUP_ARRIVED: C.amber, LOADED: C.amber,
          COMPLETED: C.green, DELIVERED: C.green,
          CANCELLED: C.red, DISPUTED: C.red,
        }[name] ?? C.text2,
      }))
    : [];

  const walletBandData = analytics
    ? Object.entries(analytics.breakdown.walletBalanceBands ?? {}).map(([name, value]) => ({
        name,
        value,
        color: {
          "No balance": "#3d5cae",
          "$0.01–$9":   C.accent,
          "$10–$49":    "#6b91ff",
          "$50+":       "#8fa9ff",
        }[name] ?? C.text2,
      }))
    : [];

  const totalWalletsFromBands = walletBandData.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <PageHead
        eyebrow="Operations"
        title="Overview"
        sub="Platform health at a glance"
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text-secondary)" }}>
            <span
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: C.green,
                boxShadow: "0 0 0 3px rgba(52,211,153,0.2)",
              }}
            />
            Live data
          </div>
        }
      />

      {error && <div className="error-banner">{error}</div>}

      {/* KPI strip */}
      <div className="kpi-grid">
        {loading || !stats ? (
          [1, 2, 3, 4, 5].map((i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <Kpi
              label="Total Users"
              value={stats.totalUsers.toLocaleString()}
              sub={<><span className="mono">{stats.totalDrivers}</span> drivers · <span className="mono">{stats.totalShippers}</span> shippers</>}
            />
            <Kpi
              label="Commission This Month"
              value={`$${Number(stats.commissionThisMonth ?? 0).toFixed(2)}`}
              sub="from completed jobs"
              accent="amber"
            />
            <Kpi
              label="Total Jobs"
              value={stats.totalJobs.toLocaleString()}
              sub={<><span className="mono">{stats.activeJobs}</span> active now</>}
            />
            <Kpi
              label="Completed Today"
              value={stats.completedJobsToday.toLocaleString()}
              accent="green"
            />
            <Kpi
              label="Wallet Funds Held"
              value={`$${Number(stats.totalWalletFunds ?? 0).toFixed(2)}`}
              sub={<><span className="mono">${Number(stats.totalCommissionCollected ?? 0).toFixed(2)}</span> earned all-time</>}
              accent="blue"
            />
          </>
        )}
      </div>

      {/* Date-range pill row + granularity */}
      <div className="toolbar" style={{ marginTop: 18, marginBottom: 6 }}>
        <div className="pill-row">
          {(["7d", "30d", "90d"] as Preset[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`pill ${preset === p ? "on" : ""}`}
              onClick={() => applyPreset(p)}
            >
              Last {p === "7d" ? "7" : p === "30d" ? "30" : "90"} days
            </button>
          ))}
          <button
            type="button"
            className={`pill ${preset === "custom" ? "on" : ""}`}
            onClick={() => applyPreset("custom")}
          >
            Custom range
          </button>
        </div>

        {preset === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="date"
              className="input mono"
              style={{ width: 170, height: 38 }}
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span style={{ color: "var(--color-text-muted)" }}>→</span>
            <input
              type="date"
              className="input mono"
              style={{ width: 170, height: 38 }}
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
            <button className="btn primary sm" onClick={load}>Apply</button>
          </div>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <span className="eyebrow" style={{ marginRight: 6 }}>Group by</span>
          <div className="pill-row" style={{ padding: 2 }}>
            {(["day", "week", "month"] as const).map((g) => (
              <button
                key={g}
                type="button"
                className={`pill ${gran === g ? "on" : ""}`}
                onClick={() => setGran(g)}
                style={{ height: 28, padding: "0 12px", fontSize: 12 }}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main time-series chart */}
      <div className="chart-card" style={{ marginTop: 12 }}>
        <div className="chart-head">
          <div>
            <div className="chart-title">
              {chartTab === "jobs" ? "Jobs over time" : chartTab === "revenue" ? "Revenue over time" : "New users over time"}
            </div>
            <div className="chart-sub">
              {preset === "custom" ? `${from} → ${to}` : `Last ${preset.replace("d", "")} days`} · grouped by {gran}
            </div>
          </div>
          <div className="pill-row" style={{ padding: 2 }}>
            {([
              { id: "jobs",    label: "Jobs" },
              { id: "revenue", label: "Revenue" },
              { id: "users",   label: "New Users" },
            ] as { id: ChartTab; label: string }[]).map((t) => (
              <button
                key={t.id}
                type="button"
                className={`pill ${chartTab === t.id ? "on" : ""}`}
                onClick={() => setChartTab(t.id)}
                style={{ height: 28, padding: "0 12px", fontSize: 12 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {mounted ? (
          <ResponsiveContainer width="100%" height={240}>
            {chartTab === "jobs" ? (
              <AreaChart data={seriesData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.accent} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.green} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="created"   name="Created"   stroke={C.accent} strokeWidth={2} fill="url(#gCreated)"   dot={false} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke={C.green}  strokeWidth={2} fill="url(#gCompleted)" dot={false} />
              </AreaChart>
            ) : chartTab === "revenue" ? (
              <AreaChart data={seriesData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.amber} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`$${v}`, "Revenue"]} />
                <Area type="monotone" dataKey="amount" name="Revenue" stroke={C.amber} strokeWidth={2} fill="url(#gRev)" dot={false} />
              </AreaChart>
            ) : (
              <BarChart data={seriesData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: C.text3, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="newUsers" name="New Users" fill={C.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            Loading chart…
          </div>
        )}
      </div>

      {/* Side-by-side breakdown */}
      <div className="charts-row r2" style={{ marginTop: 16 }}>
        {/* Jobs by status */}
        <div className="chart-card">
          <div className="chart-head">
            <div>
              <div className="chart-title">Jobs by Status</div>
              <div className="chart-sub">Current snapshot</div>
            </div>
            <div className="legend">
              <span className="sw"><span className="swatch" style={{ background: C.accent }} />Active</span>
              <span className="sw"><span className="swatch" style={{ background: C.amber }} />In progress</span>
              <span className="sw"><span className="swatch" style={{ background: C.green }} />Complete</span>
              <span className="sw"><span className="swatch" style={{ background: C.red }} />Cancelled</span>
            </div>
          </div>
          {jobStatusData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              {loading ? "Loading…" : "No data"}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {mounted ? (
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={jobStatusData} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={2} dataKey="value" strokeWidth={0}>
                      {jobStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: 140, height: 140 }} />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
                {jobStatusData.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                      <span style={{ color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.name.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="mono" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                      {s.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity stat-grid */}
        <div className="chart-card">
          <div className="chart-head">
            <div>
              <div className="chart-title">Platform Activity</div>
              <div className="chart-sub">Snapshot</div>
            </div>
          </div>
          <div className="stat-grid">
            <div>
              <div className="s-lbl">Active jobs</div>
              <div className="s-val">{stats?.activeJobs ?? "—"}</div>
            </div>
            <div>
              <div className="s-lbl">Pending docs</div>
              <div className="s-val">{stats?.pendingDocuments ?? "—"}</div>
            </div>
            <div>
              <div className="s-lbl">Total drivers</div>
              <div className="s-val">{stats?.totalDrivers ?? "—"}</div>
            </div>
            <div>
              <div className="s-lbl">Total shippers</div>
              <div className="s-val">{stats?.totalShippers ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet balance distribution */}
      <div className="chart-card" style={{ marginTop: 16 }}>
        <div className="chart-head">
          <div>
            <div className="chart-title">Driver Wallet Balances</div>
            <div className="chart-sub">Distribution across {totalWalletsFromBands} drivers</div>
          </div>
        </div>
        {walletBandData.length === 0 ? (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            {loading ? "Loading…" : "No data"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
            {walletBandData.map((s) => {
              const pct = totalWalletsFromBands > 0 ? Math.round((s.value / totalWalletsFromBands) * 100) : 0;
              return (
                <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                      <span style={{ color: "var(--color-text-secondary)" }}>{s.name}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="mono" style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{s.value}</span>
                      <span className="mono" style={{ color: "var(--color-text-muted)", width: 32, textAlign: "right" }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 999, background: "var(--color-raised)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 999,
                      width: `${pct}%`,
                      background: s.color,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action required */}
      <div className="chart-card" style={{ marginTop: 16 }}>
        <div className="chart-head">
          <div>
            <div className="chart-title">Action Required</div>
            <div className="chart-sub">Items waiting for an admin</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          <ActionItem label="Pending document reviews" value={stats?.pendingDocuments ?? null} color={C.amber} href="/dashboard/drivers" urgent />
          <ActionItem label="Active jobs in progress"  value={stats?.activeJobs ?? null}        color={C.accent} href="/dashboard/jobs" />
          <ActionItem label="Completed today"          value={stats?.completedJobsToday ?? null} color={C.green} href="/dashboard/jobs" />
        </div>
      </div>
    </div>
  );
}

// ── Sub-component ────────────────────────────────────────────────────

function ActionItem({
  label, value, color, href, urgent,
}: {
  label: string;
  value: number | null;
  color: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        borderRadius: 12,
        background: "var(--color-raised)",
        border: "1px solid var(--color-border)",
        transition: "border-color 80ms, background 80ms",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-hi)";
        (e.currentTarget as HTMLElement).style.background = "var(--color-raised-hi)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLElement).style.background = "var(--color-raised)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {urgent && value !== null && value > 0 && (
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#f87171", flexShrink: 0,
            boxShadow: "0 0 0 3px rgba(248,113,113,0.2)",
          }} />
        )}
        <span style={{
          fontSize: 14, color: "var(--color-text-secondary)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {label}
        </span>
      </div>
      <span className="mono" style={{
        marginLeft: 16,
        fontSize: 20,
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}>
        {value === null ? "—" : value.toLocaleString()}
      </span>
    </a>
  );
}
