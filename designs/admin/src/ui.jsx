/* UI primitives — Badge, Button, Modal, Input wrappers, Pagination, Checkbox */

const Badge = ({ tone = "gray", children, dot = false }) => (
  <span className={`badge ${tone}`}>
    {dot && <span className="dot"/>}
    {children}
  </span>
);

const statusBadge = (s) => {
  // Jobs status → badge color
  const blue = ["POSTED", "BIDDING", "RADIUS_EXPANDED"];
  const amber = ["MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT"];
  const green = ["COMPLETED", "DELIVERED"];
  const red = ["CANCELLED", "DISPUTED"];
  if (blue.includes(s)) return "blue";
  if (amber.includes(s)) return "amber";
  if (green.includes(s)) return "green";
  if (red.includes(s)) return "red";
  return "gray";
};

const docBadge = (s) => {
  switch (s) {
    case "PENDING":      return { tone: "amber", label: "PENDING" };
    case "UNDER_REVIEW": return { tone: "amber", label: "UNDER REVIEW" };
    case "APPROVED":     return { tone: "green", label: "APPROVED" };
    case "REJECTED":     return { tone: "red",   label: "REJECTED" };
    default:             return { tone: "gray",  label: s };
  }
};

const roleBadge = (r) => {
  switch (r) {
    case "DRIVER":  return { tone: "blue",   label: "DRIVER" };
    case "SHIPPER": return { tone: "green",  label: "SHIPPER" };
    case "BOTH":    return { tone: "purple", label: "BOTH" };
    default:        return { tone: "gray",   label: r };
  }
};

const Check = ({ on, onClick, label }) => (
  <button
    className={`check ${on ? "on" : ""}`}
    onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
    aria-label={label || "select"}
    type="button"
  />
);

const Modal = ({ open, onClose, children, wide = false }) => {
  if (!open) return null;
  React.useEffect(() => {
    const handle = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? "wide" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
};

const SearchInput = ({ value, onChange, placeholder }) => (
  <div className="input-icon" style={{ flex: 1, minWidth: 220 }}>
    <IconSearch size={15}/>
    <input className="input" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const Select = ({ value, onChange, children, style }) => (
  <select className="select" style={style} value={value} onChange={(e) => onChange(e.target.value)}>
    {children}
  </select>
);

const Pager = ({ page, totalPages, total, perPage, onPage }) => {
  if (totalPages <= 1) return (
    <div className="pager">
      <div>Showing <span className="mono">1–{total}</span> of <span className="mono">{total}</span></div>
    </div>
  );
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  const numbers = [];
  for (let i = 1; i <= totalPages; i++) numbers.push(i);
  return (
    <div className="pager">
      <div>Showing <span className="mono">{start}–{end}</span> of <span className="mono">{total}</span></div>
      <div className="pages">
        <button className="pg" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="previous">
          <IconChevronL size={12}/>
        </button>
        {numbers.map(n => (
          <button key={n} className={`pg ${page === n ? "on" : ""}`} onClick={() => onPage(n)}>{n}</button>
        ))}
        <button className="pg" disabled={page === totalPages} onClick={() => onPage(page + 1)} aria-label="next">
          <IconChevronR size={12}/>
        </button>
      </div>
    </div>
  );
};

const PageHead = ({ eyebrow, title, sub, right }) => (
  <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
    <div>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h1 className="page-title">{title}</h1>
      {sub && <div className="page-sub">{sub}</div>}
    </div>
    {right && <div>{right}</div>}
  </div>
);

const Avatar = ({ name, size = "" }) => (
  <div className={`avatar ${size}`}>{initials(name)}</div>
);

Object.assign(window, {
  Badge, statusBadge, docBadge, roleBadge,
  Check, Modal, SearchInput, Select, Pager, PageHead, Avatar
});
