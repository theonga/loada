"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
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
    <div className="login-wrap">
      <div className="login-brand">
        <div className="logo-mark">L</div>
        <div className="t1">Loada</div>
        <div className="t2">Admin Console</div>
      </div>

      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Sign in</h1>

        {error && (
          <div className="error-banner" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <path d="M12 16h.01" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="field">
          <label className="label" htmlFor="login-u">Username</label>
          <input
            id="login-u"
            className="input"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(null); }}
            autoComplete="username"
            placeholder="opsadmin"
            required
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="login-p">Password</label>
          <div className="pw-wrap">
            <input
              id="login-p"
              className="input"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              autoComplete="current-password"
              placeholder="••••••••"
              style={{ paddingRight: 80 }}
              required
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((s) => !s)}
              tabIndex={-1}
            >
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn primary full"
          disabled={loading || !username || !password}
          style={{ marginTop: 4 }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p style={{
        textAlign: "center",
        color: "var(--color-text-muted)",
        fontSize: 12,
        marginTop: 22,
      }}>
        Loada Platform · Admin access only
      </p>
    </div>
  );
}
