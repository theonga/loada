"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api.login(username, password);
      localStorage.setItem("loada_admin_token", data.token);
      router.replace("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--color-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36, gap: 16 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "#F5A623",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 28,
            color: "#000",
            boxShadow: "0 0 0 1px rgba(245,166,35,0.35), 0 8px 32px rgba(245,166,35,0.28)",
            letterSpacing: "-0.02em",
          }}>
            L
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: "var(--color-text-primary)", letterSpacing: "-0.03em", lineHeight: 1 }}>
              Loada Admin
            </div>
            <div style={{ color: "var(--color-text-muted)", fontSize: 14, marginTop: 6 }}>
              Platform management console
            </div>
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 20,
            padding: "32px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)",
          }}
        >
          {error && (
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(248,113,113,0.10)",
              border: "1px solid rgba(248,113,113,0.25)",
              color: "var(--color-danger)",
              fontSize: 14,
            }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v4M10 14h.01"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="field">
            <label htmlFor="username" className="field-label">Username</label>
            <input
              id="username"
              className="tw-input"
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password" className="field-label">Password</label>
            <input
              id="password"
              className="tw-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 4, fontSize: 15 }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 16,
                  height: 16,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                }} className="animate-spin" />
                Signing in…
              </span>
            ) : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 13, marginTop: 28 }}>
          Loada Platform · Admin access only
        </p>
      </div>
    </div>
  );
}
