"use client";

import { ReactNode, useCallback, useEffect } from "react";

/* =================================================================
   Loada Admin — shared UI primitives
   These map 1:1 to the .badge / .check / .pager / .avatar etc.
   classes defined in globals.css. Pages should import from here
   instead of rolling their own inline styles.
   ================================================================= */

// ── Badge ────────────────────────────────────────────────────────────

export type BadgeTone = "green" | "red" | "amber" | "blue" | "purple" | "gray";

export function Badge({
  tone = "gray",
  dot = false,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span className={`badge ${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

/** Job status → badge tone, matches the design's statusBadge() helper. */
export function statusTone(s: string): BadgeTone {
  if (["POSTED", "BIDDING", "RADIUS_EXPANDED"].includes(s)) return "blue";
  if (["MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT"].includes(s)) return "amber";
  if (["COMPLETED", "DELIVERED"].includes(s)) return "green";
  if (["CANCELLED", "DISPUTED"].includes(s)) return "red";
  return "gray";
}

export function docBadge(s: string): { tone: BadgeTone; label: string } {
  switch (s) {
    case "PENDING":      return { tone: "amber", label: "PENDING" };
    case "UNDER_REVIEW": return { tone: "amber", label: "UNDER REVIEW" };
    case "APPROVED":     return { tone: "green", label: "APPROVED" };
    case "REJECTED":     return { tone: "red",   label: "REJECTED" };
    case "EXPIRED":      return { tone: "red",   label: "EXPIRED" };
    default:             return { tone: "gray",  label: s };
  }
}

export function roleBadge(r: string): { tone: BadgeTone; label: string } {
  switch (r) {
    case "DRIVER":  return { tone: "blue",   label: "DRIVER" };
    case "SHIPPER": return { tone: "green",  label: "SHIPPER" };
    case "BOTH":    return { tone: "purple", label: "BOTH" };
    default:        return { tone: "gray",   label: r };
  }
}

// ── Check (custom checkbox) ─────────────────────────────────────────

export function Check({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={`check ${on ? "on" : ""}`}
      aria-checked={on}
      aria-label={label ?? "select"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    />
  );
}

// ── Avatar (monochrome accent) ──────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  size,
}: {
  name: string;
  size?: "sm" | "lg";
}) {
  return (
    <div className={size ? `avatar ${size}` : "avatar"}>
      {initials(name || "?")}
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal${wide ? " wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

// ── Page header ─────────────────────────────────────────────────────

export function PageHead({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

// ── Search input ────────────────────────────────────────────────────

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="input-icon" style={{ flex: 1, minWidth: 220 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ── Select ──────────────────────────────────────────────────────────

export function Select({
  value,
  onChange,
  children,
  style,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  return (
    <select
      className="select"
      style={style}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

// ── Numbered pager ──────────────────────────────────────────────────

export function Pager({
  page,
  totalPages,
  total,
  perPage,
  onPage,
  unit = "items",
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPage: (p: number) => void;
  unit?: string;
}) {
  const goto = useCallback(
    (p: number) => onPage(Math.max(1, Math.min(totalPages, p))),
    [onPage, totalPages],
  );

  if (total === 0) {
    return (
      <div className="pager">
        <div>No {unit}</div>
      </div>
    );
  }

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  // Collapse very long pagers (1, 2, …, current-1, current, current+1, …, last)
  const numbers: (number | "…")[] = [];
  if (totalPages <= 9) {
    for (let i = 1; i <= totalPages; i++) numbers.push(i);
  } else {
    const add = (n: number | "…") => numbers.push(n);
    add(1);
    if (page > 4) add("…");
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) add(i);
    if (page < totalPages - 3) add("…");
    add(totalPages);
  }

  return (
    <div className="pager">
      <div>
        Showing <span className="mono">{start.toLocaleString()}–{end.toLocaleString()}</span>{" "}
        of <span className="mono">{total.toLocaleString()}</span>
      </div>
      <div className="pages">
        <button className="pg" disabled={page === 1} onClick={() => goto(page - 1)} aria-label="previous">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
        {numbers.map((n, i) =>
          n === "…" ? (
            <span key={`g${i}`} className="pg" style={{ pointerEvents: "none", opacity: 0.5 }}>…</span>
          ) : (
            <button
              key={n}
              className={`pg ${page === n ? "on" : ""}`}
              onClick={() => goto(n)}
              aria-current={page === n ? "page" : undefined}
            >
              {n}
            </button>
          ),
        )}
        <button className="pg" disabled={page === totalPages} onClick={() => goto(page + 1)} aria-label="next">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Empty-row helper for tables ─────────────────────────────────────

export function EmptyRow({
  colSpan,
  icon,
  message,
}: {
  colSpan: number;
  icon: ReactNode;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-row">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span className="icon">{icon}</span>
          <span className="msg">{message}</span>
        </div>
      </td>
    </tr>
  );
}

export function LoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: "center", padding: "48px 20px", color: "var(--color-text-muted)", fontSize: 14 }}>
        Loading…
      </td>
    </tr>
  );
}
