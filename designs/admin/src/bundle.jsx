
/* ====================== icons.jsx ====================== */
/* Lucide-style icons inlined as React components.
   All accept { size = 16 } and inherit currentColor. */
const Icon = ({ size = 16, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {children}
  </svg>
);

const IconHome      = (p) => <Icon {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></Icon>;
const IconUsers     = (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M21.5 19c0-2.6-2-4.6-4.5-4.6"/></Icon>;
const IconTruck     = (p) => <Icon {...p}><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/></Icon>;
const IconPackage   = (p) => <Icon {...p}><path d="M3.3 7.3 12 12l8.7-4.7"/><path d="M12 12v9"/><path d="M3 7.5v9L12 21l9-4.5v-9L12 3z"/></Icon>;
const IconWallet    = (p) => <Icon {...p}><path d="M3 7v10a2 2 0 0 0 2 2h15v-4"/><path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z"/></Icon>;
const IconSliders   = (p) => <Icon {...p}><path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h4"/><path d="M12 12h8"/><circle cx="10" cy="12" r="2"/><path d="M4 18h12"/><path d="M20 18h0"/><circle cx="18" cy="18" r="2"/></Icon>;
const IconLogout    = (p) => <Icon {...p}><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M10 12h10"/><path d="m17 9 3 3-3 3"/></Icon>;
const IconSearch    = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const IconChevronR  = (p) => <Icon {...p}><polyline points="9 6 15 12 9 18"/></Icon>;
const IconChevronL  = (p) => <Icon {...p}><polyline points="15 6 9 12 15 18"/></Icon>;
const IconArrowR    = (p) => <Icon {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></Icon>;
const IconEye       = (p) => <Icon {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></Icon>;
const IconEyeOff    = (p) => <Icon {...p}><path d="M3 3l18 18"/><path d="M10.6 6.2A9.5 9.5 0 0 1 12 6c6 0 10 6.5 10 6.5a16.9 16.9 0 0 1-3.3 4"/><path d="M6.6 7.9A16.6 16.6 0 0 0 2 12.5S6 19 12 19a9.7 9.7 0 0 0 4.6-1.2"/><path d="M9.4 9.4a3 3 0 0 0 4.2 4.2"/></Icon>;
const IconAlert     = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></Icon>;
const IconCheck     = (p) => <Icon {...p}><polyline points="5 12 10 17 19 7"/></Icon>;
const IconX         = (p) => <Icon {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></Icon>;
const IconDollar    = (p) => <Icon {...p}><line x1="12" y1="3" x2="12" y2="21"/><path d="M17 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7"/></Icon>;
const IconGavel     = (p) => <Icon {...p}><path d="M14 4l6 6"/><path d="M11 7l6 6"/><path d="m8 10 6 6"/><path d="M4 21h10"/><path d="M3 15l6 6"/></Icon>;
const IconRadius    = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 12L19 6"/></Icon>;
const IconShield    = (p) => <Icon {...p}><path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6z"/></Icon>;
const IconCard      = (p) => <Icon {...p}><rect x="3" y="6" width="18" height="13" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>;
const IconScale     = (p) => <Icon {...p}><path d="M12 4v16"/><path d="M5 20h14"/><path d="m4 10 4-6 4 6"/><path d="m12 10 4-6 4 6"/></Icon>;
const IconArrowRight = (p) => <Icon {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></Icon>;

Object.assign(window, {
  IconHome, IconUsers, IconTruck, IconPackage, IconWallet, IconSliders, IconLogout,
  IconSearch, IconChevronR, IconChevronL, IconArrowR, IconEye, IconEyeOff, IconAlert,
  IconCheck, IconX, IconDollar, IconGavel, IconRadius, IconShield, IconCard, IconScale,
  IconArrowRight
});


/* ====================== data.jsx ====================== */
/* Mock data — realistic Zimbabwean context */

const USERS = [
  { id: "u1", name: "Tatenda Moyo", phone: "+263 77 123 4567", role: "DRIVER", status: "ACTIVE", joined: "2025-03-14" },
  { id: "u2", name: "Chiedza Mutasa", phone: "+263 77 234 5678", role: "DRIVER", status: "ACTIVE", joined: "2025-04-02" },
  { id: "u3", name: "BuildRight Zimbabwe", phone: "+263 78 901 2345", role: "SHIPPER", status: "ACTIVE", joined: "2024-11-22" },
  { id: "u4", name: "Farai Ncube", phone: "+263 77 345 6789", role: "DRIVER", status: "SUSPENDED", joined: "2025-02-08" },
  { id: "u5", name: "Harare Fresh Produce", phone: "+263 78 812 3456", role: "SHIPPER", status: "ACTIVE", joined: "2024-09-15" },
  { id: "u6", name: "Tinashe Dube", phone: "+263 77 456 7890", role: "BOTH", status: "ACTIVE", joined: "2025-01-19" },
  { id: "u7", name: "Simba Mwangi", phone: "+263 77 567 8901", role: "DRIVER", status: "ACTIVE", joined: "2025-05-03" },
  { id: "u8", name: "Zimtech Supplies", phone: "+263 78 723 4567", role: "SHIPPER", status: "ACTIVE", joined: "2024-12-04" },
  { id: "u9", name: "Rudo Chikomba", phone: "+263 77 678 9012", role: "DRIVER", status: "ACTIVE", joined: "2025-04-21" },
  { id: "u10", name: "Mukoma Logistics", phone: "+263 78 634 5678", role: "BOTH", status: "ACTIVE", joined: "2024-10-30" },
  { id: "u11", name: "Tendai Sibanda", phone: "+263 77 789 0123", role: "DRIVER", status: "ACTIVE", joined: "2025-05-19" },
  { id: "u12", name: "Cement Direct ZW", phone: "+263 78 545 6789", role: "SHIPPER", status: "SUSPENDED", joined: "2024-08-11" },
];

const DRIVERS = [
  { id: "d1", name: "Tatenda Moyo", phone: "+263 77 123 4567", capacity: "5t", truck: "Toyota Dyna 2018",   docStatus: "APPROVED",     balance: 64.50 },
  { id: "d2", name: "Chiedza Mutasa", phone: "+263 77 234 5678", capacity: "10t", truck: "Isuzu FRR 2020",    docStatus: "PENDING",      balance: 12.00 },
  { id: "d3", name: "Farai Ncube",   phone: "+263 77 345 6789", capacity: "2t",  truck: "Mazda BT-50 2017",  docStatus: "REJECTED",     balance: 0.00 },
  { id: "d4", name: "Tinashe Dube",  phone: "+263 77 456 7890", capacity: "20t", truck: "Mercedes Actros 2019", docStatus: "APPROVED", balance: 85.00 },
  { id: "d5", name: "Simba Mwangi",  phone: "+263 77 567 8901", capacity: "1t",  truck: "Nissan NP200 2016", docStatus: "UNDER_REVIEW", balance: 7.20 },
  { id: "d6", name: "Rudo Chikomba", phone: "+263 77 678 9012", capacity: "5t",  truck: "Hino 300 2019",     docStatus: "PENDING",      balance: 23.40 },
  { id: "d7", name: "Tendai Sibanda",phone: "+263 77 789 0123", capacity: "30t", truck: "Scania R450 2021",  docStatus: "APPROVED",     balance: 51.10 },
  { id: "d8", name: "Kuda Maposa",   phone: "+263 77 890 1234", capacity: "10t", truck: "Iveco Daily 2018",  docStatus: "UNDER_REVIEW", balance: 0.00 },
];

const JOBS = [
  { id: "j1", origin: "Harare CBD", dest: "Bulawayo", cargo: "Bags of cement", tonnes: "5t", price: 280, status: "IN_TRANSIT",     shipper: "BuildRight Zimbabwe",   driver: "Tatenda Moyo",  posted: "2026-05-26" },
  { id: "j2", origin: "Mutare",     dest: "Harare",   cargo: "Fresh produce",  tonnes: "2t", price: 95,  status: "BIDDING",        shipper: "Harare Fresh Produce",  driver: null,            posted: "2026-05-28" },
  { id: "j3", origin: "Gweru",      dest: "Masvingo", cargo: "Steel rods",     tonnes: "10t", price: 180, status: "MATCHED",        shipper: "Zimtech Supplies",      driver: "Tinashe Dube",  posted: "2026-05-27" },
  { id: "j4", origin: "Harare",     dest: "Chitungwiza", cargo: "Electronics", tonnes: "1t", price: 45,  status: "COMPLETED",      shipper: "Zimtech Supplies",      driver: "Simba Mwangi",  posted: "2026-05-24" },
  { id: "j5", origin: "Bulawayo",   dest: "Victoria Falls", cargo: "Bags of cement", tonnes: "20t", price: 240, status: "POSTED",  shipper: "BuildRight Zimbabwe",   driver: null,            posted: "2026-05-28" },
  { id: "j6", origin: "Harare",     dest: "Gweru",    cargo: "Fresh produce",  tonnes: "5t", price: 120, status: "CANCELLED",      shipper: "Harare Fresh Produce",  driver: null,            posted: "2026-05-22" },
  { id: "j7", origin: "Masvingo",   dest: "Harare",   cargo: "Steel rods",     tonnes: "10t", price: 165, status: "PICKUP_ARRIVED", shipper: "Mukoma Logistics",      driver: "Rudo Chikomba", posted: "2026-05-27" },
  { id: "j8", origin: "Kwekwe",     dest: "Harare",   cargo: "Electronics",    tonnes: "2t", price: 78,  status: "RADIUS_EXPANDED",shipper: "Zimtech Supplies",      driver: null,            posted: "2026-05-28" },
  { id: "j9", origin: "Harare",     dest: "Mutare",   cargo: "Bags of cement", tonnes: "5t", price: 135, status: "DISPUTED",       shipper: "BuildRight Zimbabwe",   driver: "Kuda Maposa",   posted: "2026-05-25" },
  { id: "j10", origin: "Bulawayo",  dest: "Harare",   cargo: "Fresh produce",  tonnes: "5t", price: 195, status: "DELIVERED",      shipper: "Harare Fresh Produce",  driver: "Tendai Sibanda",posted: "2026-05-23" },
  { id: "j11", origin: "Harare CBD",dest: "Norton",   cargo: "Electronics",    tonnes: "1t", price: 32,  status: "LOADED",         shipper: "Mukoma Logistics",      driver: "Chiedza Mutasa",posted: "2026-05-27" },
  { id: "j12", origin: "Beitbridge",dest: "Harare",   cargo: "Steel rods",     tonnes: "20t", price: 275, status: "PICKUP_EN_ROUTE", shipper: "BuildRight Zimbabwe",  driver: "Tinashe Dube",  posted: "2026-05-27" },
];

const WALLETS = [
  { id: "w1", name: "Tatenda Moyo",  phone: "+263 77 123 4567", balance: 64.50, reserved: 12.00, txs: [{ t: "DEPOSIT",            amount: 50.00 }, { t: "COMMISSION_RESERVE", amount: 12.00 }, { t: "COMMISSION_RELEASE", amount: 8.50 }] },
  { id: "w2", name: "Chiedza Mutasa",phone: "+263 77 234 5678", balance: 12.00, reserved: 0.00,  txs: [{ t: "DEPOSIT", amount: 15.00 }, { t: "COMMISSION_DEDUCT",  amount: 3.00 }, { t: "DEPOSIT", amount: 0 }] },
  { id: "w3", name: "Farai Ncube",   phone: "+263 77 345 6789", balance: 0.00,  reserved: 0.00,  txs: [{ t: "COMMISSION_DEDUCT", amount: 5.20 }, { t: "REFUND", amount: 2.00 }, { t: "COMMISSION_DEDUCT", amount: 6.40 }] },
  { id: "w4", name: "Tinashe Dube",  phone: "+263 77 456 7890", balance: 85.00, reserved: 27.50, txs: [{ t: "DEPOSIT", amount: 100.00 }, { t: "COMMISSION_RESERVE", amount: 27.50 }, { t: "COMMISSION_RELEASE", amount: 14.00 }] },
  { id: "w5", name: "Simba Mwangi",  phone: "+263 77 567 8901", balance: 7.20,  reserved: 0.00,  txs: [{ t: "DEPOSIT", amount: 20.00 }, { t: "COMMISSION_DEDUCT", amount: 12.80 }, { t: "REFUND", amount: 0 }] },
  { id: "w6", name: "Rudo Chikomba", phone: "+263 77 678 9012", balance: 23.40, reserved: 8.00,  txs: [{ t: "DEPOSIT", amount: 30.00 }, { t: "COMMISSION_RESERVE", amount: 8.00 }, { t: "COMMISSION_DEDUCT", amount: 6.60 }] },
  { id: "w7", name: "Tendai Sibanda",phone: "+263 77 789 0123", balance: 51.10, reserved: 18.00, txs: [{ t: "DEPOSIT", amount: 60.00 }, { t: "COMMISSION_RESERVE", amount: 18.00 }, { t: "COMMISSION_RELEASE", amount: 9.10 }] },
  { id: "w8", name: "Kuda Maposa",   phone: "+263 77 890 1234", balance: 0.00,  reserved: 0.00,  txs: [{ t: "COMMISSION_DEDUCT", amount: 8.00 }, { t: "REFUND", amount: 8.00 }, { t: "DEPOSIT", amount: 0 }] },
];

const CONFIG = {
  pricing: {
    label: "Pricing",
    accent: "amber",
    items: [
      { key: "commission_pct",        label: "Commission percentage",   value: 15,  unit: "%" },
      { key: "min_deposit_usd",       label: "Minimum deposit",          value: 5,   unit: "$" },
    ],
  },
  bidding: {
    label: "Bidding",
    accent: "blue",
    items: [
      { key: "bid_ttl_sec",           label: "Bid TTL",                  value: 300, unit: "s" },
      { key: "max_concurrent_bids",   label: "Max concurrent bids",      value: 3,   unit: "" },
      { key: "cancel_limit_week",     label: "Cancel limit per week",    value: 2,   unit: "" },
    ],
  },
  matching: {
    label: "Matching",
    accent: "cyan",
    items: [
      { key: "initial_radius_km",     label: "Initial radius",           value: 15,  unit: "km" },
      { key: "expansion_km",          label: "Expansion step",           value: 10,  unit: "km" },
      { key: "max_expansions",        label: "Max expansions",           value: 4,   unit: "" },
    ],
  },
  auth: {
    label: "Authentication",
    accent: "purple",
    items: [
      { key: "otp_expiry_min",        label: "OTP expiry",               value: 5,   unit: "min" },
      { key: "otp_max_attempts",      label: "Max OTP attempts",         value: 5,   unit: "" },
    ],
  },
  payments: {
    label: "Payments",
    accent: "green",
    items: [
      { key: "paynow_poll_interval",  label: "Paynow poll interval",     value: 5,   unit: "s" },
      { key: "paynow_poll_timeout",   label: "Paynow poll timeout",      value: 180, unit: "s" },
    ],
  },
  market: {
    label: "Market Reference",
    accent: "orange",
    items: [
      { key: "market_cache_ttl",      label: "Cache TTL",                value: 600, unit: "s" },
      { key: "market_min_sample",     label: "Min sample size",          value: 5,   unit: "" },
      { key: "rate_per_km_1t",        label: "Rate per km · 1t",         value: 0.45,unit: "$" },
      { key: "rate_per_km_2t",        label: "Rate per km · 2t",         value: 0.65,unit: "$" },
      { key: "rate_per_km_5t",        label: "Rate per km · 5t",         value: 0.95,unit: "$" },
      { key: "rate_per_km_10t",       label: "Rate per km · 10t",        value: 1.40,unit: "$" },
      { key: "rate_per_km_20t",       label: "Rate per km · 20t",        value: 2.10,unit: "$" },
      { key: "rate_per_km_30t",       label: "Rate per km · 30t",        value: 2.85,unit: "$" },
    ],
  },
};

// Initials helper
const initials = (name) => name.split(" ").filter(Boolean).slice(0,2).map(s => s[0]).join("").toUpperCase();

// Format helpers
const fmtMoney = (n, { sign = false } = {}) => {
  const abs = Math.abs(n);
  const v = abs.toFixed(2);
  if (sign) return `${n < 0 ? "−" : "+"}$${v}`;
  return `$${v}`;
};
const fmtInt = (n) => n.toLocaleString("en-US");

Object.assign(window, { USERS, DRIVERS, JOBS, WALLETS, CONFIG, initials, fmtMoney, fmtInt });


/* ====================== ui.jsx ====================== */
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


/* ====================== sidebar.jsx ====================== */
/* Sidebar */

const NAV = [
  {
    label: "Operations",
    items: [
      { id: "overview", label: "Overview", icon: IconHome },
      { id: "users",    label: "Users",    icon: IconUsers },
      { id: "drivers",  label: "Drivers",  icon: IconTruck },
      { id: "jobs",     label: "Jobs",     icon: IconPackage },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "wallets",       label: "Wallets",       icon: IconWallet },
      { id: "configuration", label: "Configuration", icon: IconSliders },
    ],
  },
];

const Sidebar = ({ current, onNav, onLogout }) => (
  <aside className="sidebar">
    <div className="brand">
      <div className="logo-mark">L</div>
      <div>
        <div className="brand-name">Loada</div>
        <div className="brand-sub">Admin Console</div>
      </div>
    </div>

    {NAV.map(group => (
      <div className="nav-group" key={group.label}>
        <div className="nav-group-label">{group.label}</div>
        {group.items.map(item => {
          const I = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${current === item.id ? "active" : ""}`}
              onClick={() => onNav(item.id)}
            >
              <span className="nav-icon"><I size={16}/></span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    ))}

    <div className="sidebar-foot">
      <div className="avatar">OK</div>
      <div className="who">
        <div className="who-name">opsadmin</div>
        <div className="who-role">Admin</div>
      </div>
      <button className="icon-btn" aria-label="Log out" title="Log out" onClick={onLogout}>
        <IconLogout size={14}/>
      </button>
    </div>
  </aside>
);

Object.assign(window, { Sidebar });


/* ====================== login.jsx ====================== */
/* Login screen */

const LoginScreen = ({ onLogin }) => {
  const [u, setU] = React.useState("opsadmin");
  const [p, setP] = React.useState("hunter2");
  const [showPw, setShowPw] = React.useState(false);
  const [err, setErr] = React.useState(true); // demo: show error banner state by default
  const [busy, setBusy] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(false);
    setTimeout(() => {
      setBusy(false);
      // any credentials sign you in in this prototype
      onLogin && onLogin();
    }, 350);
  };

  return (
    <div className="login-wrap">
      <div className="login-brand">
        <div className="logo-mark">L</div>
        <div className="t1">Loada</div>
        <div className="t2">Admin Console</div>
      </div>

      <form className="login-card" onSubmit={submit}>
        <h1>Sign in</h1>

        {err && (
          <div className="error-banner">
            <IconAlert size={14}/>
            <span>Invalid username or password</span>
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="login-u">Username</label>
          <input id="login-u" className="input" value={u} onChange={(e) => { setU(e.target.value); setErr(false); }} autoComplete="username" />
        </div>

        <div className="field">
          <label className="label" htmlFor="login-p">Password</label>
          <div className="pw-wrap">
            <input
              id="login-p"
              className="input"
              type={showPw ? "text" : "password"}
              value={p}
              onChange={(e) => { setP(e.target.value); setErr(false); }}
              autoComplete="current-password"
              style={{ paddingRight: 80 }}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button type="submit" className="btn primary full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
};

Object.assign(window, { LoginScreen });


/* ====================== charts.jsx ====================== */
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


/* ====================== overview.jsx ====================== */
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


/* ====================== users.jsx ====================== */
/* Screen 3 — Users */

const Users = () => {
  const [list, setList] = React.useState(() => USERS.map(u => ({ ...u })));
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [selected, setSelected] = React.useState(new Set());
  const [hoverId, setHoverId] = React.useState(null);
  const [suspendTarget, setSuspendTarget] = React.useState(null);
  const [suspendReason, setSuspendReason] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 8;

  const filtered = list.filter(u => {
    const matchesSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === pageData.length) setSelected(new Set());
    else setSelected(new Set(pageData.map(u => u.id)));
  };

  const doSuspend = () => {
    if (!suspendReason.trim()) return;
    setList(list.map(u => u.id === suspendTarget.id ? { ...u, status: "SUSPENDED" } : u));
    setSuspendTarget(null);
    setSuspendReason("");
  };

  const doUnsuspend = (id) => {
    setList(list.map(u => u.id === id ? { ...u, status: "ACTIVE" } : u));
  };

  const bulkSuspend = () => {
    setList(list.map(u => selected.has(u.id) ? { ...u, status: "SUSPENDED" } : u));
    setSelected(new Set());
  };

  return (
    <div className="main">
      <PageHead eyebrow="Operations" title="Users" sub="All registered accounts" />

      <div className="toolbar">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or phone…" />
        <Select value={roleFilter} onChange={(v) => { setRoleFilter(v); setPage(1); }} style={{ width: 170 }}>
          <option value="ALL">All roles</option>
          <option value="DRIVER">Drivers</option>
          <option value="SHIPPER">Shippers</option>
          <option value="BOTH">Both</option>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="bulkbar">
          <span><span className="count">{selected.size}</span> selected</span>
          <div className="grow"/>
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn danger sm" onClick={bulkSuspend}>Suspend selected</button>
        </div>
      )}

      <div className="table-scroll">
      <table className="t">
        <thead>
          <tr>
            <th style={{ width: 38 }}>
              <Check on={selected.size > 0 && selected.size === pageData.length} onClick={toggleAll} label="select all" />
            </th>
            <th>Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pageData.map((u, idx) => {
            const r = roleBadge(u.role);
            return (
              <tr
                key={u.id}
                className={`${selected.has(u.id) ? "selected" : ""} ${hoverId === u.id || (hoverId == null && idx === 1) ? "hovered" : ""}`}
                onMouseEnter={() => setHoverId(u.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                <td><Check on={selected.has(u.id)} onClick={() => toggle(u.id)} label={`select ${u.name}`} /></td>
                <td>
                  <div className="user-cell">
                    <Avatar name={u.name} size="sm"/>
                    <div className="name">{u.name}</div>
                  </div>
                </td>
                <td className="mono" style={{ color: "var(--text-2)" }}>{u.phone}</td>
                <td><Badge tone={r.tone}>{r.label}</Badge></td>
                <td>
                  {u.status === "ACTIVE"
                    ? <Badge tone="green" dot>ACTIVE</Badge>
                    : <Badge tone="red"   dot>SUSPENDED</Badge>}
                </td>
                <td className="mono" style={{ color: "var(--text-2)" }}>{u.joined}</td>
                <td>
                  <div className="row-actions">
                    {u.status === "ACTIVE"
                      ? <button className="btn danger sm" onClick={() => setSuspendTarget(u)}>Suspend</button>
                      : <button className="btn ghost sm" onClick={() => doUnsuspend(u.id)}>Unsuspend</button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      <Pager page={page} totalPages={totalPages} total={filtered.length} perPage={perPage} onPage={setPage} />

      <Modal open={!!suspendTarget} onClose={() => { setSuspendTarget(null); setSuspendReason(""); }}>
        {suspendTarget && (
          <>
            <h3>Suspend {suspendTarget.name}</h3>
            <p className="body">
              Suspended accounts lose platform access immediately. {suspendTarget.role === "DRIVER" && "Drivers cannot bid on new jobs."}
              {suspendTarget.role === "SHIPPER" && "Shippers cannot post new jobs."}
              {suspendTarget.role === "BOTH" && "They will lose both bidding and posting privileges."}
              {" "}Active bids and jobs are not affected.
            </p>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Reason <span style={{ color: "var(--danger)" }}>*</span></label>
              <textarea className="input" placeholder="Explain why this account is being suspended…" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} />
            </div>
            <div className="actions">
              <button className="btn ghost" onClick={() => { setSuspendTarget(null); setSuspendReason(""); }}>Cancel</button>
              <button className="btn danger" onClick={doSuspend} disabled={!suspendReason.trim()}>Suspend account</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

Object.assign(window, { Users });


/* ====================== drivers.jsx ====================== */
/* Screen 4 — Drivers */

const Drivers = () => {
  const [list, setList] = React.useState(() => DRIVERS.map(d => ({ ...d, licenceExpiry: "2027-08-14", regExpiry: "2026-12-02" })));
  const [search, setSearch] = React.useState("");
  const [docFilter, setDocFilter] = React.useState("ALL");
  const [selected, setSelected] = React.useState(new Set());
  const [hoverId, setHoverId] = React.useState(null);
  const [reviewTarget, setReviewTarget] = React.useState(null);
  const [rejectMode, setRejectMode] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [bulkOpen, setBulkOpen] = React.useState(null); // "approve" | "reject"
  const [bulkReason, setBulkReason] = React.useState("");

  const filtered = list.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search);
    const matchFilter = docFilter === "ALL" || d.docStatus === docFilter;
    return matchSearch && matchFilter;
  });

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(d => d.id)));
  };

  const selectedHasPending = list
    .filter(d => selected.has(d.id))
    .some(d => d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW");

  const setStatus = (id, status) => setList(list.map(d => d.id === id ? { ...d, docStatus: status } : d));

  const approve = () => { setStatus(reviewTarget.id, "APPROVED"); setReviewTarget(null); setRejectMode(false); };
  const rejectConfirm = () => {
    if (!rejectReason.trim()) return;
    setStatus(reviewTarget.id, "REJECTED");
    setReviewTarget(null); setRejectMode(false); setRejectReason("");
  };

  const bulkApprove = () => {
    setList(list.map(d => selected.has(d.id) && (d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW") ? { ...d, docStatus: "APPROVED" } : d));
    setSelected(new Set()); setBulkOpen(null);
  };
  const bulkReject = () => {
    if (!bulkReason.trim()) return;
    setList(list.map(d => selected.has(d.id) && (d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW") ? { ...d, docStatus: "REJECTED" } : d));
    setSelected(new Set()); setBulkOpen(null); setBulkReason("");
  };

  return (
    <div className="main">
      <PageHead eyebrow="Operations" title="Drivers" sub="Document verification and driver management" />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone…" />
        <Select value={docFilter} onChange={setDocFilter} style={{ width: 190 }}>
          <option value="ALL">All documents</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="bulkbar">
          <span><span className="count">{selected.size}</span> selected</span>
          <div className="grow"/>
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn success sm" disabled={!selectedHasPending} onClick={() => setBulkOpen("approve")}>Approve docs</button>
          <button className="btn danger sm"  disabled={!selectedHasPending} onClick={() => setBulkOpen("reject")}>Reject docs</button>
        </div>
      )}

      <div className="table-scroll">
      <table className="t">
        <thead>
          <tr>
            <th style={{ width: 38 }}>
              <Check on={selected.size > 0 && selected.size === filtered.length} onClick={toggleAll}/>
            </th>
            <th>Driver</th>
            <th>Phone</th>
            <th>Capacity</th>
            <th>Truck</th>
            <th>Doc status</th>
            <th style={{ textAlign: "right" }}>Wallet</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((d, idx) => {
            const b = docBadge(d.docStatus);
            const balColor = d.balance < 10 ? "var(--danger)" : d.balance >= 50 ? "var(--success)" : "var(--text)";
            return (
              <tr key={d.id}
                  className={`${selected.has(d.id) ? "selected" : ""} ${hoverId === d.id || (hoverId == null && idx === 1) ? "hovered" : ""}`}
                  onMouseEnter={() => setHoverId(d.id)}
                  onMouseLeave={() => setHoverId(null)}>
                <td><Check on={selected.has(d.id)} onClick={() => toggle(d.id)} /></td>
                <td>
                  <div className="user-cell">
                    <Avatar name={d.name} size="sm"/>
                    <div className="name">{d.name}</div>
                  </div>
                </td>
                <td className="mono" style={{ color: "var(--text-2)" }}>{d.phone}</td>
                <td className="mono">{d.capacity}</td>
                <td style={{ color: "var(--text-2)" }}>{d.truck}</td>
                <td><Badge tone={b.tone}>{b.label}</Badge></td>
                <td className="mono" style={{ textAlign: "right", color: balColor, fontWeight: 600 }}>${d.balance.toFixed(2)}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn ghost sm" onClick={() => { setReviewTarget(d); setRejectMode(false); setRejectReason(""); }}>
                      Review docs
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Doc review modal */}
      <Modal open={!!reviewTarget} onClose={() => { setReviewTarget(null); setRejectMode(false); setRejectReason(""); }} wide>
        {reviewTarget && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, gap: 16 }}>
              <div>
                <h3 style={{ marginBottom: 4 }}>{reviewTarget.name}</h3>
                <div className="mono" style={{ color: "var(--text-3)", fontSize: 12 }}>
                  {reviewTarget.truck} · Reg ZW-{reviewTarget.id.toUpperCase()}-{Math.floor(Math.random() * 9000) + 1000 || 4521}
                </div>
              </div>
              <Badge tone={docBadge(reviewTarget.docStatus).tone}>{docBadge(reviewTarget.docStatus).label}</Badge>
            </div>

            <div className="doc-grid">
              <div className="doc-thumb">
                <div className="ph">DRIVER LICENCE</div>
                <div className="meta">
                  <div className="lbl">Expires</div>
                  <div className="exp">{reviewTarget.licenceExpiry}</div>
                </div>
              </div>
              <div className="doc-thumb">
                <div className="ph">TRUCK REGISTRATION</div>
                <div className="meta">
                  <div className="lbl">Expires</div>
                  <div className="exp">{reviewTarget.regExpiry}</div>
                </div>
              </div>
            </div>

            {rejectMode && (
              <div className="field" style={{ marginTop: 6 }}>
                <label className="label">Rejection reason <span style={{ color: "var(--danger)" }}>*</span></label>
                <textarea className="input" placeholder="Tell the driver what to fix (e.g. blurry photo, expired licence)…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              </div>
            )}

            <div className="actions">
              {(reviewTarget.docStatus === "PENDING" || reviewTarget.docStatus === "UNDER_REVIEW") && !rejectMode && (
                <>
                  <button className="btn ghost" onClick={() => setReviewTarget(null)}>Cancel</button>
                  <button className="btn danger" onClick={() => setRejectMode(true)}>Reject</button>
                  <button className="btn primary" onClick={approve}>Approve</button>
                </>
              )}
              {rejectMode && (
                <>
                  <button className="btn ghost" onClick={() => { setRejectMode(false); setRejectReason(""); }}>Back</button>
                  <button className="btn danger" onClick={rejectConfirm} disabled={!rejectReason.trim()}>Confirm rejection</button>
                </>
              )}
              {(reviewTarget.docStatus === "APPROVED" || reviewTarget.docStatus === "REJECTED") && !rejectMode && (
                <>
                  <button className="btn ghost" onClick={() => setReviewTarget(null)}>Close</button>
                  <button className="btn primary" onClick={() => setStatus(reviewTarget.id, "UNDER_REVIEW") || setReviewTarget(null)}>Re-open for review</button>
                </>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Bulk approve modal */}
      <Modal open={bulkOpen === "approve"} onClose={() => setBulkOpen(null)}>
        <h3>Approve documents</h3>
        <p className="body">Approve <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>{Array.from(selected).filter(id => { const d = list.find(x => x.id === id); return d && (d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW"); }).length}</span> drivers' documents? They will be able to start bidding on jobs immediately.</p>
        <div className="actions">
          <button className="btn ghost" onClick={() => setBulkOpen(null)}>Cancel</button>
          <button className="btn primary" onClick={bulkApprove}>Approve</button>
        </div>
      </Modal>

      {/* Bulk reject modal */}
      <Modal open={bulkOpen === "reject"} onClose={() => { setBulkOpen(null); setBulkReason(""); }}>
        <h3>Reject documents</h3>
        <p className="body">Reject <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>{Array.from(selected).filter(id => { const d = list.find(x => x.id === id); return d && (d.docStatus === "PENDING" || d.docStatus === "UNDER_REVIEW"); }).length}</span> drivers' documents. The reason will be sent to each driver.</p>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Reason <span style={{ color: "var(--danger)" }}>*</span></label>
          <textarea className="input" placeholder="e.g. Photos are blurry — please re-upload in good lighting" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} />
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => { setBulkOpen(null); setBulkReason(""); }}>Cancel</button>
          <button className="btn danger" onClick={bulkReject} disabled={!bulkReason.trim()}>Confirm rejection</button>
        </div>
      </Modal>
    </div>
  );
};

Object.assign(window, { Drivers });


/* ====================== jobs.jsx ====================== */
/* Screen 5 — Jobs */

const CANCELLABLE = new Set(["POSTED","BIDDING","RADIUS_EXPANDED","MATCHED","PICKUP_EN_ROUTE","PICKUP_ARRIVED","LOADED","IN_TRANSIT"]);

const JOB_STATUSES = ["POSTED","BIDDING","RADIUS_EXPANDED","MATCHED","PICKUP_EN_ROUTE","PICKUP_ARRIVED","LOADED","IN_TRANSIT","COMPLETED","DELIVERED","CANCELLED","DISPUTED"];

const Jobs = () => {
  const [list, setList] = React.useState(() => JOBS.map(j => ({ ...j })));
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [selected, setSelected] = React.useState(new Set());
  const [hoverId, setHoverId] = React.useState(null);
  const [forceOpen, setForceOpen] = React.useState(false);
  const [forceReason, setForceReason] = React.useState("");
  const [singleCancelTarget, setSingleCancelTarget] = React.useState(null);

  const filtered = list.filter(j => {
    const matchSearch = !search
      || j.id.toLowerCase().includes(search.toLowerCase())
      || j.origin.toLowerCase().includes(search.toLowerCase())
      || j.dest.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const cancellableSelected = list.filter(j => selected.has(j.id) && CANCELLABLE.has(j.status));

  const toggle = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(j => j.id)));
  };

  const doForceCancel = () => {
    if (!forceReason.trim()) return;
    const ids = singleCancelTarget ? new Set([singleCancelTarget.id]) : new Set(cancellableSelected.map(j => j.id));
    setList(list.map(j => ids.has(j.id) ? { ...j, status: "CANCELLED" } : j));
    setForceOpen(false); setForceReason(""); setSingleCancelTarget(null); setSelected(new Set());
  };

  return (
    <div className="main">
      <PageHead eyebrow="Operations" title="Jobs" sub="All loads posted on the platform" />

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by job ID, origin or destination…" />
        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 220 }}>
          <option value="ALL">All statuses</option>
          {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="bulkbar">
          <span><span className="count">{selected.size}</span> selected · <span className="mono">{cancellableSelected.length}</span> cancellable</span>
          <div className="grow"/>
          <button className="btn ghost sm" onClick={() => setSelected(new Set())}>Clear</button>
          <button className="btn danger sm" disabled={!cancellableSelected.length} onClick={() => setForceOpen(true)}>Force cancel</button>
        </div>
      )}

      <div className="table-scroll">
      <table className="t">
        <thead>
          <tr>
            <th style={{ width: 38 }}>
              <Check on={selected.size > 0 && selected.size === filtered.length} onClick={toggleAll}/>
            </th>
            <th>Route</th>
            <th>Cargo</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th>Status</th>
            <th>Shipper</th>
            <th>Driver</th>
            <th>Posted</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((j, idx) => (
            <tr key={j.id}
                className={`${selected.has(j.id) ? "selected" : ""} ${hoverId === j.id || (hoverId == null && idx === 1) ? "hovered" : ""}`}
                onMouseEnter={() => setHoverId(j.id)}
                onMouseLeave={() => setHoverId(null)}>
              <td><Check on={selected.has(j.id)} onClick={() => toggle(j.id)} /></td>
              <td>
                <div className="route-cell">
                  <div className="from truncate">{j.origin}</div>
                  <div className="to truncate"><IconArrowRight size={11}/> {j.dest}</div>
                </div>
              </td>
              <td>
                <div style={{ fontWeight: 500 }}>{j.cargo}</div>
                <div className="mono" style={{ color: "var(--text-3)", fontSize: 12 }}>{j.tonnes}</div>
              </td>
              <td className="mono" style={{ textAlign: "right", fontWeight: 600 }}>${j.price.toFixed(2)}</td>
              <td><Badge tone={statusBadge(j.status)}>{j.status.replace(/_/g, " ")}</Badge></td>
              <td style={{ color: "var(--text-2)" }} className="truncate">{j.shipper}</td>
              <td className={j.driver ? "" : "mono"} style={{ color: j.driver ? "var(--text)" : "var(--text-3)" }}>{j.driver || "—"}</td>
              <td className="mono" style={{ color: "var(--text-2)" }}>{j.posted}</td>
              <td>
                <div className="row-actions">
                  {CANCELLABLE.has(j.status)
                    ? <button className="btn danger sm" onClick={() => { setSingleCancelTarget(j); setForceOpen(true); }}>Cancel</button>
                    : <span style={{ color: "var(--text-3)", fontSize: 12 }}>—</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Pager page={1} totalPages={1} total={filtered.length} perPage={filtered.length} onPage={() => {}} />

      <Modal open={forceOpen} onClose={() => { setForceOpen(false); setForceReason(""); setSingleCancelTarget(null); }}>
        <h3>Cancel {singleCancelTarget ? "this job" : `${cancellableSelected.length} jobs`}?</h3>
        <p className="body">
          This action is irreversible. {singleCancelTarget ? "The driver and shipper" : "All affected drivers and shippers"} will be notified, and any reserved commission will be refunded.
        </p>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label">Reason <span style={{ color: "var(--danger)" }}>*</span></label>
          <textarea className="input" placeholder="Why are you force-cancelling?" value={forceReason} onChange={(e) => setForceReason(e.target.value)} />
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => { setForceOpen(false); setForceReason(""); setSingleCancelTarget(null); }}>Cancel</button>
          <button className="btn danger" onClick={doForceCancel} disabled={!forceReason.trim()}>Force Cancel</button>
        </div>
      </Modal>
    </div>
  );
};

Object.assign(window, { Jobs });


/* ====================== wallets.jsx ====================== */
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


/* ====================== configuration.jsx ====================== */
/* Screen 7 — Configuration */

const SECTION_ICONS = {
  pricing: { Icon: IconDollar, color: "var(--amber)",   bg: "rgba(245,166,35,0.14)" },
  bidding: { Icon: IconGavel,  color: "var(--accent)",  bg: "rgba(79,124,255,0.14)" },
  matching:{ Icon: IconRadius, color: "var(--cyan)",    bg: "rgba(34,211,238,0.14)" },
  auth:    { Icon: IconShield, color: "var(--purple)",  bg: "rgba(167,139,250,0.14)" },
  payments:{ Icon: IconCard,   color: "var(--success)", bg: "rgba(52,211,153,0.14)" },
  market:  { Icon: IconScale,  color: "var(--orange)",  bg: "rgba(251,146,60,0.14)" },
};

const ConfigSection = ({ id, section, onSave }) => {
  const meta = SECTION_ICONS[id];
  const I = meta.Icon;
  const [editing, setEditing] = React.useState(null);
  const [draft, setDraft] = React.useState("");
  const [savedKey, setSavedKey] = React.useState(null);

  const startEdit = (item) => { setEditing(item.key); setDraft(String(item.value)); };
  const commit = (item) => {
    const num = parseFloat(draft);
    if (isNaN(num)) return;
    onSave(item.key, num);
    setEditing(null);
    setSavedKey(item.key);
    setTimeout(() => setSavedKey(k => k === item.key ? null : k), 1600);
  };

  return (
    <div className={`config-card ${section.accent}`}>
      <div className="config-head">
        <div className="ico" style={{ background: meta.bg, color: meta.color }}><I size={16}/></div>
        <div className="title">{section.label}</div>
        <div className="count">{section.items.length} keys</div>
      </div>
      <div className="config-body">
        {section.items.map(item => {
          const isEditing = editing === item.key;
          return (
            <div key={item.key} className={`row ${isEditing ? "editing" : ""}`}>
              <div className="k">{item.label}</div>
              {!isEditing && (
                <div className="v mono" onClick={() => startEdit(item)} role="button" tabIndex={0}>
                  {item.unit === "$" ? `$${item.value}` : `${item.value}${item.unit ? ` ${item.unit}` : ""}`}
                </div>
              )}
              {isEditing && (
                <>
                  <input
                    className="edit-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commit(item); if (e.key === "Escape") setEditing(null); }}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button className="btn ghost sm" onClick={() => setEditing(null)}>Cancel</button>
                    <button className="btn primary sm" onClick={() => commit(item)}>Save</button>
                  </div>
                </>
              )}
              {!isEditing && savedKey === item.key && (
                <span className="saved"><IconCheck size={12}/> Saved</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Configuration = () => {
  const [config, setConfig] = React.useState(() => JSON.parse(JSON.stringify(CONFIG)));

  const updateKey = (sectionId, key, value) => {
    setConfig(c => ({
      ...c,
      [sectionId]: {
        ...c[sectionId],
        items: c[sectionId].items.map(it => it.key === key ? { ...it, value } : it),
      },
    }));
  };

  return (
    <div className="main">
      <PageHead eyebrow="Platform" title="Configuration" sub="Live operational settings — changes take effect immediately" />

      <div className="config-banner">
        <IconAlert size={16}/>
        <div className="body"><strong>Live settings.</strong> Changes are applied in real time. Redis cache clears within 60 seconds.</div>
      </div>

      <div className="config-grid">
        {Object.entries(config).map(([id, section]) => (
          <ConfigSection key={id} id={id} section={section} onSave={(k, v) => updateKey(id, k, v)} />
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { Configuration });


/* ====================== app.jsx ====================== */
/* App shell with view routing */

const VIEWS = {
  overview:      { Comp: Overview,      requiresAuth: true },
  users:         { Comp: Users,         requiresAuth: true },
  drivers:       { Comp: Drivers,       requiresAuth: true },
  jobs:          { Comp: Jobs,          requiresAuth: true },
  wallets:       { Comp: Wallets,       requiresAuth: true },
  configuration: { Comp: Configuration, requiresAuth: true },
};

const App = () => {
  // Default to authed so the dashboard shows immediately; logout returns to Login screen.
  const [authed, setAuthed] = React.useState(() => localStorage.getItem("loada_auth") !== "0");
  const [view, setView] = React.useState(() => localStorage.getItem("loada_view") || "overview");
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => { localStorage.setItem("loada_view", view); }, [view]);
  React.useEffect(() => { localStorage.setItem("loada_auth", authed ? "1" : "0"); }, [authed]);

  const onNav = (v) => { setView(v); setMobileNavOpen(false); };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const { Comp } = VIEWS[view] || VIEWS.overview;

  return (
    <div className="shell">
      <button className="mobile-menu-btn" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
      </button>
      <div className="mobile-brand">
        <div className="logo-mark">L</div>
        <div>
          <div className="brand-name">Loada</div>
          <div className="brand-sub">Admin Console</div>
        </div>
      </div>

      {mobileNavOpen && <div className="mobile-overlay" onClick={() => setMobileNavOpen(false)}/>}

      <div className={`sidebar-wrap ${mobileNavOpen ? "open" : ""}`}>
        <Sidebar current={view} onNav={onNav} onLogout={() => setAuthed(false)} />
        <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
      </div>

      <Comp />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);

