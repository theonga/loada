"use client";
import { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { api, AdminStats, AnalyticsData } from "@/lib/api";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  accent:  "#4f7cff",
  green:   "#34d399",
  red:     "#f87171",
  blue:    "#4f7cff",
  purple:  "#a78bfa",
  cyan:    "#22d3ee",
  amber:   "#F5A623",
  divider: "#2a2f3e",
  text2:   "#8b92a5",
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
  labelStyle:  { color: "#8b92a5", marginBottom: 6, fontWeight: 600 },
  itemStyle:   { color: "#e8eaf0" },
  cursor:      { fill: "rgba(255,255,255,0.025)" },
};

// ── Preset date ranges ────────────────────────────────────────────────────────
type Preset = "7d" | "30d" | "90d" | "custom";

function presetRange(p: Preset): { from: string; to: string } {
  const to   = new Date();
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

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, trend, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: { dir: "up" | "down"; label: string };
  accent?: "blue" | "green" | "amber";
}) {
  const valueColor = accent === "blue" ? C.accent : accent === "green" ? C.green : accent === "amber" ? C.amber : "var(--color-text-primary)";
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 10,
      minWidth: 0,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
        {label}
      </span>
      <span style={{
        fontSize: 32,
        fontWeight: 700,
        fontFamily: "DM Mono, ui-monospace",
        fontVariantNumeric: "tabular-nums",
        color: valueColor,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}>
        {value}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {sub && (
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sub}
          </span>
        )}
        {trend && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: trend.dir === "up" ? C.green : C.red,
            background: trend.dir === "up" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
            padding: "2px 7px",
            borderRadius: 999,
            flexShrink: 0,
          }}>
            {trend.dir === "up" ? "↑" : "↓"} {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16,
      padding: "24px",
    }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>{title}</p>
        {sub && <p style={{ color: "var(--color-text-secondary)", fontSize: 13, marginTop: 3 }}>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

type ChartTab = "jobs" | "revenue" | "users";

// ── Page ──────────────────────────────────────────────────────────────────────
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
          POSTED: C.amber, BIDDING: C.blue, MATCHED: C.purple,
          IN_TRANSIT: C.cyan, COMPLETED: C.green,
          CANCELLED: C.red, DISPUTED: C.red,
        }[name] ?? C.text2,
      }))
    : [];

  const walletBandData = analytics
    ? Object.entries(analytics.breakdown.walletBalanceBands ?? {}).map(([name, value]) => ({
        name,
        value,
        color: {
          "No balance": C.red,
          "$0.01–$9":   C.amber,
          "$10–$49":    C.blue,
          "$50+":       C.green,
        }[name] ?? C.text2,
      }))
    : [];

  const totalWalletsFromBands = walletBandData.reduce((s, r) => s + r.value, 0);

  // ── Skeleton rows for loading ──────────────────────────────────────
  const SkeletonCard = () => (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ height: 11, width: 80, background: "var(--color-surface-raised)", borderRadius: 6 }} />
      <div style={{ height: 32, width: 120, background: "var(--color-surface-raised)", borderRadius: 8 }} />
      <div style={{ height: 13, width: 100, background: "var(--color-surface-raised)", borderRadius: 6 }} />
    </div>
  );

  return (
    <div className="page-wrap" style={{ maxWidth: 1600 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 32 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <p className="page-eyebrow">Operations</p>
          <h1 className="page-title">Overview</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text-secondary)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, display: "inline-block", boxShadow: `0 0 0 3px rgba(52,211,153,0.2)` }} />
          Live data
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {loading ? (
          [1,2,3,4,5].map((i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              label="Total Users"
              value={stats ? stats.totalUsers.toLocaleString() : "—"}
              sub={stats ? `${stats.totalDrivers} drivers · ${stats.totalShippers} shippers` : undefined}
            />
            <KpiCard
              label="Commission This Month"
              value={stats ? `$${Number(stats.commissionThisMonth ?? 0).toFixed(2)}` : "—"}
              sub="from completed jobs"
              accent="amber"
            />
            <KpiCard
              label="Total Jobs"
              value={stats ? stats.totalJobs.toLocaleString() : "—"}
              sub={stats ? `${stats.activeJobs} active now` : undefined}
            />
            <KpiCard
              label="Completed Today"
              value={stats ? stats.completedJobsToday.toLocaleString() : "—"}
              accent="green"
            />
            <KpiCard
              label="Wallet Funds Held"
              value={stats ? `$${Number(stats.totalWalletFunds ?? 0).toFixed(2)}` : "—"}
              sub={stats ? `$${Number(stats.totalCommissionCollected ?? 0).toFixed(2)} earned all-time` : undefined}
              accent="blue"
            />
          </>
        )}
      </div>

      {/* ── Date-range toolbar ── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 20 }}>
        {(["7d", "30d", "90d", "custom"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => applyPreset(p)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              border: preset === p
                ? "1px solid rgba(79,124,255,0.45)"
                : "1px solid var(--color-border)",
              background: preset === p
                ? "rgba(79,124,255,0.12)"
                : "var(--color-surface-raised)",
              color: preset === p
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
            }}
          >
            {p === "7d" ? "Last 7 days" : p === "30d" ? "Last 30 days" : p === "90d" ? "Last 90 days" : "Custom range"}
          </button>
        ))}

        {preset === "custom" && (
          <>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
              className="tw-input num" style={{ width: 160, height: 36, padding: "0 12px", fontSize: 13 }} />
            <span style={{ color: "var(--color-text-muted)", fontSize: 13 }}>→</span>
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)}
              className="tw-input num" style={{ width: 160, height: 36, padding: "0 12px", fontSize: 13 }} />
            <button onClick={load} className="btn btn-primary btn-sm">Apply</button>
          </>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 6 }}>
            Group by
          </span>
          {(["day", "week", "month"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGran(g)}
              style={{
                padding: "5px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                background: gran === g ? "var(--color-surface-raised)" : "transparent",
                color: gran === g ? "var(--color-text-primary)" : "var(--color-text-muted)",
                border: gran === g ? "1px solid var(--color-border)" : "1px solid transparent",
              }}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main chart ── */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: "24px",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{
            display: "flex",
            gap: 4,
            padding: 4,
            background: "var(--color-bg)",
            borderRadius: 10,
            border: "1px solid var(--color-border)",
          }}>
            {([
              { id: "jobs",    label: "Jobs" },
              { id: "revenue", label: "Revenue" },
              { id: "users",   label: "New Users" },
            ] as { id: ChartTab; label: string }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setChartTab(t.id)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  background: chartTab === t.id ? "var(--color-surface-raised)" : "transparent",
                  color: chartTab === t.id ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  border: chartTab === t.id ? "1px solid var(--color-border)" : "1px solid transparent",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {loading && (
            <span style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Loading…
            </span>
          )}
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
                <XAxis dataKey="label" tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="created"   name="Created"   stroke={C.accent} strokeWidth={2} fill="url(#gCreated)"   dot={false} />
                <Area type="monotone" dataKey="completed" name="Completed" stroke={C.green}  strokeWidth={2} fill="url(#gCompleted)" dot={false} />
              </AreaChart>
            ) : chartTab === "revenue" ? (
              <AreaChart data={seriesData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.green} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`$${v}`, "Revenue"]} />
                <Area type="monotone" dataKey="amount" name="Revenue" stroke={C.green} strokeWidth={2} fill="url(#gRev)" dot={false} />
              </AreaChart>
            ) : (
              <BarChart data={seriesData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.divider} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: C.text2, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="newUsers" name="New Users" fill={C.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Loading chart…</div>
          </div>
        )}
      </div>

      {/* ── Two side-by-side breakdown charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Jobs by status */}
        <ChartCard title="Jobs by Status" sub="Current distribution across all time">
          {jobStatusData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
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
                <div style={{ width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", border: `4px solid var(--color-border)`, borderTopColor: C.accent }} className="animate-spin" />
                </div>
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
                    <span style={{ fontFamily: "DM Mono, monospace", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--color-text-primary)", flexShrink: 0 }}>
                      {s.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Wallet balance distribution */}
        <ChartCard title="Driver Wallet Balances" sub="How funds are distributed across drivers">
          {walletBandData.length === 0 ? (
            <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
              {loading ? "Loading…" : "No data"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
              {walletBandData.map((s) => {
                const pct = totalWalletsFromBands > 0 ? Math.round((s.value / totalWalletsFromBands) * 100) : 0;
                return (
                  <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                        <span style={{ color: "var(--color-text-secondary)" }}>{s.name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: "DM Mono, monospace", fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--color-text-primary)" }}>
                          {s.value}
                        </span>
                        <span style={{ fontFamily: "DM Mono, monospace", fontVariantNumeric: "tabular-nums", color: "var(--color-text-muted)", width: 32, textAlign: "right" }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "var(--color-surface-raised)", overflow: "hidden" }}>
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
        </ChartCard>
      </div>

      {/* ── Action required ── */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: "24px",
      }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.01em", marginBottom: 16 }}>
          Action Required
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
          <ActionItem label="Pending document reviews" value={stats?.pendingDocuments ?? null} color={C.amber} href="/dashboard/drivers" urgent />
          <ActionItem label="Active jobs in progress"  value={stats?.activeJobs ?? null}        color={C.blue}  href="/dashboard/jobs" />
          <ActionItem label="Completed today"          value={stats?.completedJobsToday ?? null} color={C.green} href="/dashboard/jobs" />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function ActionItem({ label, value, color, href, urgent }: {
  label: string; value: number | null; color: string; href: string; urgent?: boolean;
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
        background: "var(--color-surface-raised)",
        border: "1px solid var(--color-border)",
        transition: "border-color 0.15s, background 0.15s",
        cursor: "pointer",
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#3a4055";
        (e.currentTarget as HTMLElement).style.background = "#252a38";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
        (e.currentTarget as HTMLElement).style.background = "var(--color-surface-raised)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        {urgent && value !== null && value > 0 && (
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f87171", flexShrink: 0, boxShadow: "0 0 0 3px rgba(248,113,113,0.2)" }} className="animate-pulse" />
        )}
        <span style={{ fontSize: 14, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
      </div>
      <span style={{
        marginLeft: 16,
        fontSize: 20,
        fontWeight: 700,
        fontFamily: "DM Mono, monospace",
        fontVariantNumeric: "tabular-nums",
        color,
        flexShrink: 0,
      }}>
        {value === null ? "—" : value.toLocaleString()}
      </span>
    </a>
  );
}
