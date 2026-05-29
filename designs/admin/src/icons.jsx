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
