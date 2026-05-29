"use client";
import { useEffect, useState, useCallback } from "react";
import { api, WalletRecord, WalletStats } from "@/lib/api";
import {
  PageHead, SearchInput, Avatar, Modal, Pager,
  LoadingRow, EmptyRow,
} from "@/components/ui";

const LIMIT = 25;

// Maps each wallet-tx type to the .tx-chip variant + formatter
const TX_CHIPS: Record<string, { tone: string; format: (n: number) => string }> = {
  DEPOSIT:            { tone: "green",  format: (n) => `+$${n.toFixed(2)}` },
  COMMISSION_RESERVE: { tone: "amber",  format: (n) => `−$${n.toFixed(2)} held` },
  COMMISSION_RELEASE: { tone: "blue",   format: (n) => `+$${n.toFixed(2)} released` },
  COMMISSION_DEDUCT:  { tone: "red",    format: (n) => `−$${n.toFixed(2)} fee` },
  REFUND:             { tone: "green",  format: (n) => `+$${n.toFixed(2)} refund` },
  ADJUSTMENT:         { tone: "purple", format: (n) => `${n >= 0 ? "+" : "−"}$${Math.abs(n).toFixed(2)} adj` },
};

function txChip(type: string, amount: number) {
  const meta = TX_CHIPS[type] ?? { tone: "blue", format: (n: number) => `$${n.toFixed(2)}` };
  return <span className={`tx-chip ${meta.tone}`}>{meta.format(amount)}</span>;
}

function balanceTone(balance: number): { color: string; weight: number } {
  if (balance < 10) return { color: "var(--color-danger)",  weight: 700 };
  if (balance >= 50) return { color: "var(--color-success)", weight: 700 };
  return { color: "var(--color-text-primary)", weight: 600 };
}

export default function WalletsPage() {
  const [wallets,  setWallets]  = useState<WalletRecord[]>([]);
  const [stats,    setStats]    = useState<WalletStats | null>(null);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<WalletRecord | null>(null);
  const [adjAmt,   setAdjAmt]   = useState("");
  const [adjNote,  setAdjNote]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (search.trim()) params.search = search.trim();
      const d = await api.getWallets(params);
      setWallets(d.wallets);
      setTotal(d.total);
      setStats(d.stats);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  function openAdjust(wallet: WalletRecord) {
    setModal(wallet);
    setAdjAmt("");
    setAdjNote("");
  }

  async function doAdjust() {
    if (!modal) return;
    const amt = parseFloat(adjAmt);
    if (isNaN(amt) || amt === 0) { setError("Enter a non-zero amount (negative to debit)"); return; }
    if (!adjNote.trim()) { setError("Reason is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await api.adjustWallet(modal.driverId, amt, adjNote.trim());
      setWallets((prev) => prev.map((w) =>
        w.id === modal.id ? { ...w, balance: res.wallet.balance } : w,
      ));
      setModal(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // Stats strip — all figures come from the API and are computed across EVERY
  // wallet, not just the current page. `totalHeld` here matches the overview
  // KPI "Wallet Funds Held" exactly (balance + reservedBalance, globally).
  const totalHeld     = stats?.totalHeld     ?? 0;
  const totalReserved = stats?.totalReserved ?? 0;
  const zeroCount     = stats?.zeroCount     ?? 0;
  const avg           = stats?.avg           ?? 0;
  const driversCount  = stats?.driversCount  ?? 0;

  const amtNum = parseFloat(adjAmt || "0") || 0;
  const newBalance = modal ? Number(modal.balance) + amtNum : 0;

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <PageHead
        eyebrow="Platform"
        title="Driver Wallets"
        sub="Wallet balances and transaction history"
      />

      <div className="toolbar">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1); }}
          placeholder="Search by driver name or phone…"
        />
      </div>

      <div className="stats-strip">
        <div className="s">
          <div className="lbl">Total funds held</div>
          <div className="val">${totalHeld.toFixed(2)}</div>
        </div>
        <div className="s">
          <div className="lbl">Reserved</div>
          <div className="val">${totalReserved.toFixed(2)}</div>
        </div>
        <div className="s">
          <div className="lbl">Empty wallets</div>
          <div className={`val ${zeroCount > 0 ? "red" : ""}`}>{zeroCount}</div>
        </div>
        <div className="s">
          <div className="lbl">Average balance</div>
          <div className="val">${avg.toFixed(2)}</div>
        </div>
        <div className="s">
          <div className="lbl">Drivers tracked</div>
          <div className="val">{driversCount.toLocaleString()}</div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

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
            {loading ? (
              <LoadingRow colSpan={7} />
            ) : wallets.length === 0 ? (
              <EmptyRow
                colSpan={7}
                icon={
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 10h20" />
                    <path d="M6 15h3M13 15h5" />
                  </svg>
                }
                message="No wallets found"
              />
            ) : wallets.map((w) => {
              const balance   = Number(w.balance);
              const reserved  = Number(w.reservedBalance);
              const available = +(balance - reserved).toFixed(2);
              const tone = balanceTone(balance);
              return (
                <tr key={w.id}>
                  <td>
                    <div className="user-cell">
                      <Avatar name={w.driver.user.name} size="sm" />
                      <div className="name">{w.driver.user.name}</div>
                    </div>
                  </td>
                  <td className="mono" style={{ color: "var(--color-text-secondary)" }}>
                    {w.driver.user.phone}
                  </td>
                  <td className="mono" style={{ textAlign: "right", color: tone.color, fontWeight: tone.weight }}>
                    ${balance.toFixed(2)}
                  </td>
                  <td className="mono" style={{
                    textAlign: "right",
                    color: reserved > 0 ? "var(--color-amber)" : "var(--color-text-muted)",
                  }}>
                    ${reserved.toFixed(2)}
                  </td>
                  <td className="mono" style={{
                    textAlign: "right",
                    fontWeight: 600,
                    color: available < 5 ? "var(--color-danger)" : "var(--color-text-primary)",
                  }}>
                    ${available.toFixed(2)}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
                      {w.transactions.length === 0 ? (
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>None</span>
                      ) : w.transactions.slice(0, 3).map((tx) => (
                        <span key={tx.id} title={tx.note ?? undefined}>
                          {txChip(tx.type, Number(tx.amount))}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn ghost sm" onClick={() => openAdjust(w)}>Adjust</button>
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
        unit="wallets"
      />

      <Modal open={!!modal} onClose={() => setModal(null)}>
        {modal && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <Avatar name={modal.driver.user.name} size="lg" />
              <div>
                <h3 style={{ marginBottom: 2 }}>Adjust balance</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                  {modal.driver.user.name} · current:{" "}
                  <span className="mono" style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
                    ${Number(modal.balance).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            <div className="field">
              <label className="label">
                Amount (USD) — positive credit, negative debit
              </label>
              <input
                className="input mono"
                placeholder="e.g. 15.00 or -3.50"
                value={adjAmt}
                onChange={(e) => setAdjAmt(e.target.value)}
                style={{ fontSize: 20, height: 56, fontWeight: 600 }}
                autoFocus
              />
              {adjAmt !== "" && !isNaN(amtNum) && amtNum !== 0 && (
                <div className="balance-pre">
                  Balance: <span>${Number(modal.balance).toFixed(2)}</span>
                  <span className="arrow">→</span>
                  <span className={`new ${newBalance > Number(modal.balance) ? "up" : "down"}`}>
                    ${newBalance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">
                Reason <span style={{ color: "var(--color-danger)" }}>*</span>
              </label>
              <textarea
                className="input"
                placeholder="e.g. Manual refund for cancelled job J-2841"
                value={adjNote}
                onChange={(e) => setAdjNote(e.target.value)}
              />
            </div>

            <div className="actions">
              <button className="btn ghost" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="btn primary"
                disabled={!adjNote.trim() || adjAmt === "" || isNaN(amtNum) || amtNum === 0 || saving}
                onClick={doAdjust}
              >
                {saving ? "Saving…" : "Adjust balance"}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
