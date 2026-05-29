"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="6" r="3" />
      <path d="M2 18c0-3.314 2.686-6 6-6s6 2.686 6 6" />
      <circle cx="15" cy="6.5" r="2.5" />
      <path d="M14 14c1.5-.65 2.5.15 4 1" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="11" height="9" rx="1.5" />
      <path d="M12 7.5h3.5L18 11v4h-6V7.5z" />
      <circle cx="4.5" cy="14" r="1.5" />
      <circle cx="14" cy="14" r="1.5" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="12" height="14" rx="2" />
      <path d="M8 3a2 2 0 012-2h0a2 2 0 012 2" />
      <path d="M7 9h6M7 13h4" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="4.5" width="17" height="11" rx="2" />
      <path d="M1.5 9h17" />
      <path d="M5 13h4" strokeWidth="2" />
    </svg>
  );
}

function IconSliders() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h14M3 10h14M3 15h14" />
      <circle cx="8" cy="5" r="2" />
      <circle cx="14" cy="10" r="2" />
      <circle cx="7" cy="15" r="2" />
    </svg>
  );
}

// ── Nav structure ─────────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard",               label: "Overview",       icon: <IconGrid /> },
      { href: "/dashboard/users",         label: "Users",          icon: <IconUsers /> },
      { href: "/dashboard/drivers",       label: "Drivers",        icon: <IconTruck /> },
      { href: "/dashboard/jobs",          label: "Jobs",           icon: <IconClipboard /> },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/dashboard/subscriptions", label: "Wallets",        icon: <IconCard /> },
      { href: "/dashboard/config",        label: "Configuration",  icon: <IconSliders /> },
    ],
  },
];

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("loada_admin_token");
    if (!token) { router.replace("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUsername(payload.username ?? "admin");
    } catch { /* ignore */ }
  }, [router]);

  function logout() {
    localStorage.removeItem("loada_admin_token");
    router.replace("/login");
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg)" }}>

      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside style={{
        width: 248,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
        boxShadow: "8px 0 32px rgba(0,0,0,0.40)",
        overflow: "hidden",
        position: "relative",
        zIndex: 1,
      }}>

        {/* Logo zone */}
        <div style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "#F5A623",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 16,
            color: "#000",
            flexShrink: 0,
            boxShadow: "0 0 0 1px rgba(245,166,35,0.3), 0 4px 12px rgba(245,166,35,0.20)",
          }}>
            L
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              Loada
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--color-text-muted)", marginTop: 3 }}>
              Admin Console
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px" }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 28 : 0 }}>
              {/* Section label */}
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--color-text-muted)",
                padding: "0 8px",
                marginBottom: 8,
              }}>
                {group.label}
              </div>

              {/* Nav items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.items.map((item) => {
                  const active = item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px 10px 13px",
                        borderRadius: 10,
                        borderLeft: active
                          ? "3px solid var(--color-accent)"
                          : "3px solid transparent",
                        background: active
                          ? "rgba(79, 124, 255, 0.12)"
                          : "transparent",
                        color: active
                          ? "var(--color-text-primary)"
                          : "var(--color-text-secondary)",
                        fontSize: 14,
                        fontWeight: active ? 600 : 500,
                        textDecoration: "none",
                        transition: "background 0.15s, color 0.15s, border-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                          (e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
                        }
                      }}
                    >
                      <span style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User zone */}
        <div style={{
          borderTop: "1px solid var(--color-border)",
          padding: "16px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}>
          {/* Avatar */}
          <div style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(79,124,255,0.15)",
            border: "1px solid rgba(79,124,255,0.30)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-accent)",
            flexShrink: 0,
          }}>
            {username[0]?.toUpperCase() ?? "A"}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {username || "admin"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Admin
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out"
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              color: "var(--color-text-muted)",
              transition: "color 0.15s, background 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--color-danger)";
              (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.10)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4h4v12h-4M8 14l-4-4 4-4M4 10h9" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: "auto", padding: "32px 40px 40px 28px" }}>
        {children}
      </main>
    </div>
  );
}
