"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./layout.module.css";

const NAV = [
  { href: "/dashboard",              label: "Overview",      icon: "◻" },
  { href: "/dashboard/config",       label: "Config",        icon: "⚙" },
  { href: "/dashboard/users",        label: "Users",         icon: "👤" },
  { href: "/dashboard/drivers",      label: "Drivers",       icon: "🚛" },
  { href: "/dashboard/jobs",         label: "Jobs",          icon: "📦" },
  { href: "/dashboard/subscriptions",label: "Subscriptions", icon: "💳" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>L</span>
          <span className={styles.brandName}>Loada Admin</span>
        </div>

        <nav className={styles.nav}>
          {NAV.map((item) => {
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.active : ""}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.footerUser}>{username}</span>
          <button className={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
