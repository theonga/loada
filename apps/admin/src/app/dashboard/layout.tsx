"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// ── Sidebar icons (Lucide-style, 1.8 stroke) ─────────────────────────

type IconProps = { size?: number };
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconHome    ({ size = 16 }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>; }
function IconUsers   ({ size = 16 }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M21.5 19c0-2.6-2-4.6-4.5-4.6"/></svg>; }
function IconTruck   ({ size = 16 }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/></svg>; }
function IconPackage ({ size = 16 }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}><path d="M3.3 7.3 12 12l8.7-4.7"/><path d="M12 12v9"/><path d="M3 7.5v9L12 21l9-4.5v-9L12 3z"/></svg>; }
function IconWallet  ({ size = 16 }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}><path d="M3 7v10a2 2 0 0 0 2 2h15v-4"/><path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z"/></svg>; }
function IconSliders ({ size = 16 }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}><path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h4"/><path d="M12 12h8"/><circle cx="10" cy="12" r="2"/><path d="M4 18h12"/><path d="M20 18h0"/><circle cx="18" cy="18" r="2"/></svg>; }
function IconLogout  ({ size = 14 }: IconProps) { return <svg width={size} height={size} viewBox="0 0 24 24" {...stroke}><path d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2"/><path d="M10 12h10"/><path d="m17 9 3 3-3 3"/></svg>; }

// ── Nav structure ────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<IconProps>;
  match?: (path: string) => boolean;
};

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard",         label: "Overview", Icon: IconHome,    match: (p) => p === "/dashboard" },
      { href: "/dashboard/users",   label: "Users",    Icon: IconUsers },
      { href: "/dashboard/drivers", label: "Drivers",  Icon: IconTruck },
      { href: "/dashboard/jobs",    label: "Jobs",     Icon: IconPackage },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/dashboard/wallets",       label: "Wallets",       Icon: IconWallet },
      { href: "/dashboard/config",        label: "Configuration", Icon: IconSliders },
    ],
  },
];

function isActive(path: string, item: NavItem): boolean {
  if (item.match) return item.match(path);
  return path === item.href || path.startsWith(item.href + "/");
}

// ── Layout ───────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("loada_admin_token");
    if (!token) { router.replace("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUsername(payload.username ?? "admin");
    } catch { /* ignore — token is opaque */ }
  }, [router]);

  // Close the drawer on route change (mobile)
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  function logout() {
    localStorage.removeItem("loada_admin_token");
    router.replace("/login");
  }

  return (
    <div className="shell">
      {/* Mobile chrome — only visible on narrow viewports */}
      <button
        type="button"
        className="mobile-menu-btn"
        aria-label="Open menu"
        onClick={() => setMobileNavOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="7"  x2="20" y2="7"  />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>

      <div className="mobile-brand">
        <div className="logo-mark">L</div>
        <div>
          <div className="brand-name">Loada</div>
          <div className="brand-sub">Admin Console</div>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="mobile-overlay" onClick={() => setMobileNavOpen(false)} />
      )}

      <div className={`sidebar-wrap ${mobileNavOpen ? "open" : ""}`}>
        <aside className="sidebar">
          <div className="brand">
            <div className="logo-mark">L</div>
            <div>
              <div className="brand-name">Loada</div>
              <div className="brand-sub">Admin Console</div>
            </div>
          </div>

          {NAV.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                const { Icon } = item;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item${active ? " active" : ""}`}
                  >
                    <span className="nav-icon"><Icon size={16} /></span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="sidebar-foot">
            <div className="avatar sm">{(username[0] ?? "A").toUpperCase()}</div>
            <div className="who">
              <div className="who-name">{username || "admin"}</div>
              <div className="who-role">Admin</div>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Log out"
              title="Log out"
              onClick={logout}
            >
              <IconLogout size={14} />
            </button>
          </div>
        </aside>

        <button
          type="button"
          className="mobile-close"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6"  x2="18" y2="18" />
            <line x1="18" y1="6" x2="6"  y2="18" />
          </svg>
        </button>
      </div>

      <main className="main" style={{ overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
