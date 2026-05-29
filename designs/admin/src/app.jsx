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
