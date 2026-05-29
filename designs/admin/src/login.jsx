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
