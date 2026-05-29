"use client";
import { useEffect, useState, useCallback } from "react";
import { api, FlaggedMessageRecord, LowBidJobRecord } from "@/lib/api";
import {
  PageHead, Pager, Badge, LoadingRow, EmptyRow, statusTone,
} from "@/components/ui";

type Tab = "messages" | "lowbids";

const LIMIT = 25;

export default function AuditPage() {
  const [tab,         setTab]         = useState<Tab>("messages");
  const [messages,    setMessages]    = useState<FlaggedMessageRecord[]>([]);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [lowBids,     setLowBids]     = useState<LowBidJobRecord[]>([]);
  const [threshold,   setThreshold]   = useState(60);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "messages") {
        const d = await api.getFlaggedMessages({ page: String(page), limit: String(LIMIT) });
        setMessages(d.messages);
        setMessagesTotal(d.total);
      } else {
        const d = await api.getLowBids({ page: String(page), limit: String(LIMIT) });
        setLowBids(d.jobs);
        setThreshold(d.threshold);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => { load(); }, [load]);

  const totalPages = tab === "messages"
    ? Math.max(1, Math.ceil(messagesTotal / LIMIT))
    : 1;

  return (
    <div>
      <PageHead
        eyebrow="Trust & Safety"
        title="Audit"
        sub="Off-platform negotiation signals and price-vs-market outliers"
      />

      <div className="pill-row" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className={`pill ${tab === "messages" ? "on" : ""}`}
          onClick={() => setTab("messages")}
        >
          Flagged messages
        </button>
        <button
          type="button"
          className={`pill ${tab === "lowbids" ? "on" : ""}`}
          onClick={() => setTab("lowbids")}
        >
          Low-bid jobs
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {tab === "messages" ? (
        <FlaggedMessagesTable
          rows={messages}
          loading={loading}
        />
      ) : (
        <LowBidsTable
          rows={lowBids}
          threshold={threshold}
          loading={loading}
        />
      )}

      {tab === "messages" && (
        <Pager
          page={page}
          totalPages={totalPages}
          total={messagesTotal}
          perPage={LIMIT}
          onPage={setPage}
          unit="messages"
        />
      )}
    </div>
  );
}

// ── Flagged messages ─────────────────────────────────────────────────────────

function FlaggedMessagesTable({ rows, loading }: { rows: FlaggedMessageRecord[]; loading: boolean }) {
  return (
    <div className="table-scroll">
      <table className="t">
        <thead>
          <tr>
            <th>Sender</th>
            <th>Role</th>
            <th>Message</th>
            <th>Flag</th>
            <th>Job</th>
            <th>Sent</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LoadingRow colSpan={6} />
          ) : rows.length === 0 ? (
            <EmptyRow
              colSpan={6}
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5h18v12H6l-3 3z" />
                  <path d="M9 11h.01M12 11h.01M15 11h.01" />
                </svg>
              }
              message="No flagged messages"
            />
          ) : rows.map((m) => (
            <tr key={m.id}>
              <td>{m.sender.name}</td>
              <td>
                <Badge tone={m.sender.role === "DRIVER" ? "blue" : m.sender.role === "SHIPPER" ? "green" : "purple"}>
                  {m.sender.role}
                </Badge>
              </td>
              <td style={{ maxWidth: 360 }}>
                <div style={{ fontSize: 13, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {m.content ?? "—"}
                </div>
              </td>
              <td style={{ fontSize: 11 }}>
                {m.flaggedReason.split(",").map((r) => (
                  <span key={r} style={{
                    display: "inline-block",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    marginRight: 4,
                    marginBottom: 2,
                    borderRadius: 4,
                    background: "rgba(245,166,35,0.14)",
                    color: "var(--color-amber)",
                    letterSpacing: 0.3,
                  }}>{r}</span>
                ))}
              </td>
              <td className="truncate" style={{ maxWidth: 200, fontSize: 12, color: "var(--color-text-secondary)" }}>
                {m.job.originAddress.split(",")[0]} → {m.job.destAddress.split(",")[0]}
              </td>
              <td className="mono" style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                {new Date(m.createdAt).toLocaleString("en-GB", {
                  day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Low-bid jobs ─────────────────────────────────────────────────────────────

function LowBidsTable({ rows, threshold, loading }: { rows: LowBidJobRecord[]; threshold: number; loading: boolean }) {
  return (
    <>
      <div style={{
        marginBottom: 12,
        padding: "10px 14px",
        background: "var(--color-raised)",
        borderRadius: 8,
        fontSize: 13,
        color: "var(--color-text-secondary)",
      }}>
        Showing accepted bids where the agreed price is below{" "}
        <span className="mono" style={{ fontWeight: 600, color: "var(--color-amber)" }}>{threshold}%</span>{" "}
        of the per-km × tonnage market estimate. Adjust the threshold in Configuration → Trust & Safety.
      </div>
      <div className="table-scroll">
        <table className="t">
          <thead>
            <tr>
              <th>Route</th>
              <th>Load</th>
              <th style={{ textAlign: "right" }}>Bid</th>
              <th style={{ textAlign: "right" }}>Est. market</th>
              <th style={{ textAlign: "right" }}>Ratio</th>
              <th>Status</th>
              <th>Shipper</th>
              <th>Driver</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRow colSpan={8} />
            ) : rows.length === 0 ? (
              <EmptyRow
                colSpan={8}
                icon={
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="3" x2="12" y2="21" />
                    <path d="M17 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7" />
                  </svg>
                }
                message="No low-bid jobs"
              />
            ) : rows.map((j) => (
              <tr key={j.id}>
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
                  <div className="mono" style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                    {j.distanceKm.toFixed(0)} km
                  </div>
                </td>
                <td className="mono">{j.requiredTonnes}t</td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>
                  ${Number(j.bidPrice).toFixed(2)}
                </td>
                <td className="mono" style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>
                  ${j.estimatedMarket.toFixed(2)}
                </td>
                <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--color-danger)" }}>
                  {j.ratioPct}%
                </td>
                <td><Badge tone={statusTone(j.status)}>{j.status.replace(/_/g, " ")}</Badge></td>
                <td className="truncate" style={{ color: "var(--color-text-secondary)" }}>{j.shipperName}</td>
                <td className="truncate" style={{ color: "var(--color-text-secondary)" }}>{j.driverName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
