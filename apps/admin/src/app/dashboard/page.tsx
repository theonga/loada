"use client";
import { useEffect, useState } from "react";
import { api, AdminStats } from "@/lib/api";
import styles from "./page.module.css";

const STAT_CARDS: Array<{ key: keyof AdminStats; label: string; format?: "usd" }> = [
  { key: "totalUsers",          label: "Total Users" },
  { key: "totalDrivers",        label: "Drivers" },
  { key: "totalShippers",       label: "Shippers" },
  { key: "activeSubscriptions", label: "Active Subscriptions" },
  { key: "totalJobs",           label: "Total Jobs" },
  { key: "activeJobs",          label: "Active Jobs" },
  { key: "completedJobsToday",  label: "Completed Today" },
  { key: "totalRevenue",        label: "Total Revenue", format: "usd" },
  { key: "pendingDocuments",    label: "Pending Docs" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getStats()
      .then((d) => setStats(d.stats))
      .catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div>
      <h1 className={styles.heading}>Overview</h1>
      <div className={styles.grid}>
        {STAT_CARDS.map(({ key, label, format }) => (
          <div key={key} className={`card ${styles.stat}`}>
            <div className={styles.statLabel}>{label}</div>
            <div className={styles.statValue}>
              {stats == null ? "—" : format === "usd"
                ? `$${Number(stats[key]).toLocaleString()}`
                : Number(stats[key]).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
