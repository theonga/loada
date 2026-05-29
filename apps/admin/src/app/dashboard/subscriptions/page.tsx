"use client";
import { useEffect, useState } from "react";
import { api, WalletRecord } from "@/lib/api";

const TX_TYPE_LABEL: Record<string, string> = {
  DEPOSIT:            "Deposit",
  COMMISSION_RESERVE: "Reserved",
  COMMISSION_RELEASE: "Released",
  COMMISSION_DEDUCT:  "Commission",
  REFUND:             "Refund",
};

const TX_TYPE_COLOR: Record<string, string> = {
  DEPOSIT:            "#34d399",
  COMMISSION_RESERVE: "#fbbf24",
  COMMISSION_RELEASE: "#22d3ee",
  COMMISSION_DEDUCT:  "#f87171",
  REFUND:             "#a78bfa",
};

const AVATAR_COLORS = ["#4f7cff","#34d399","#fbbf24","#a78bfa","#22d3ee","#fb923c","#f87171"];
function avatarColor(name: string) { return AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(); }

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const c = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${c}18`, border: `1px solid ${c}35`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.33, fontWeight: 700, color: c,
    }}>
      {initials(name)}
    </div>
  );
}

export default function WalletsPage() {
  const [wallets,  setWallets]  = useState<WalletRecord[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<WalletRecord | null>(null);
  const [adjAmount, setAdjAmount] = useState("");
  const [adjNote,   setAdjNote]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const LIMIT = 50;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(LIMIT) };
      if (search.trim()) params.search = search.trim();
      const d = await api.getWallets(params);
      setWallets(d.wallets);
      setTotal(d.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  function openAdjust(wallet: WalletRecord) {
    setModal(wallet);
    setAdjAmount("");
    setAdjNote("");
  }

  async function doAdjust() {
    if (!modal) return;
    const amt = parseFloat(adjAmount);
    if (isNaN(amt) || amt === 0) { setError("Enter a non-zero amount (negative to debit)"); return; }
    if (!adjNote.trim()) { setError("Reason is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await api.adjustWallet(modal.driverId, amt, adjNote.trim());
      setWallets((prev) => prev.map((w) =>
        w.id === modal.id ? { ...w, balance: res.wallet.balance } : w
      ));
      setModal(null);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="page-wrap">
      <div className="page-header">
        <p className="page-eyebrow">Platform</p>
        <h1 className="page-title">Driver Wallets</h1>
      </div>

      <div className="toolbar">
        <input
          className="tw-input"
          style={{ width: 260, height: 36, padding: "0 12px", fontSize: 13 }}
          placeholder="Search by driver name…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tw-card">
        <table className="tw-table">
          <thead>
            <tr>
              <th>Driver</th>
              <th className="text-right">Balance</th>
              <th className="text-right">Reserved</th>
              <th className="text-right">Available</th>
              <th>Recent Transactions</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "48px 20px", color: "var(--color-text-muted)", fontSize: 14 }}>Loading…</td></tr>
            ) : wallets.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h3M13 15h5"/>
                  </svg>
                  <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>No wallets found</span>
                </div>
              </td></tr>
            ) : wallets.map((w) => {
              const balance  = Number(w.balance);
              const reserved = Number(w.reservedBalance);
              const available = balance - reserved;
              const isLow = balance < 10;

              return (
                <tr key={w.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={w.driver.user.name} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-primary)" }}>{w.driver.user.name}</div>
                        <div className="num" style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{w.driver.user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right">
                    <span className="num" style={{
                      fontSize: 14, fontWeight: 700,
                      color: isLow ? "#f87171" : "#34d399",
                    }}>
                      ${balance.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="num" style={{ fontSize: 13, color: reserved > 0 ? "#fbbf24" : "var(--color-text-muted)" }}>
                      ${reserved.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="num" style={{
                      fontSize: 13, fontWeight: 600,
                      color: available < 5 ? "#f87171" : "var(--color-text-secondary)",
                    }}>
                      ${available.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {w.transactions.length === 0 ? (
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>None</span>
                      ) : w.transactions.slice(0, 3).map((tx) => {
                        const c = TX_TYPE_COLOR[tx.type] ?? "#8b92a5";
                        return (
                          <div
                            key={tx.id}
                            title={`${TX_TYPE_LABEL[tx.type] ?? tx.type}: $${tx.amount}${tx.note ? ` — ${tx.note}` : ""}`}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              background: `${c}18`, border: `1px solid ${c}35`,
                              borderRadius: 6, padding: "3px 7px",
                            }}
                          >
                            <span style={{ fontSize: 10, fontWeight: 700, color: c }}>
                              {TX_TYPE_LABEL[tx.type] ?? tx.type}
                            </span>
                            <span className="num" style={{ fontSize: 11, fontWeight: 600, color: c }}>
                              ${Number(tx.amount).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => openAdjust(w)}>
                      Adjust
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="num" style={{ fontSize: 13 }}>{total.toLocaleString()} wallets — page {page} of {pages}</span>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1}    onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      </div>

      {modal && (
        <div className="overlay">
          <div className="dialog">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Avatar name={modal.driver.user.name} size={44} />
              <div>
                <h3 className="dialog-title">Adjust wallet balance</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 3 }}>
                  {modal.driver.user.name} · current balance: <span className="num" style={{ fontWeight: 700 }}>${Number(modal.balance).toFixed(2)}</span>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="field">
                <label className="field-label">Amount (positive to credit, negative to debit)</label>
                <input
                  type="number"
                  step="0.01"
                  className="tw-input num"
                  placeholder="e.g. 10 or -5"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Reason</label>
                <input
                  type="text"
                  className="tw-input"
                  placeholder="e.g. Goodwill credit for delayed job"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                />
              </div>
              {adjAmount && !isNaN(parseFloat(adjAmount)) && parseFloat(adjAmount) !== 0 && (
                <div className="warn-banner">
                  <span>{parseFloat(adjAmount) > 0 ? "✓" : "⚠"}</span>
                  <span>
                    Balance will change from <strong>${Number(modal.balance).toFixed(2)}</strong> →{" "}
                    <strong>${(Number(modal.balance) + parseFloat(adjAmount)).toFixed(2)}</strong>
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={doAdjust}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : "Apply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
