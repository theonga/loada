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
