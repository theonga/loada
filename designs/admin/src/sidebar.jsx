/* Sidebar */

const NAV = [
  {
    label: "Operations",
    items: [
      { id: "overview", label: "Overview", icon: IconHome },
      { id: "users",    label: "Users",    icon: IconUsers },
      { id: "drivers",  label: "Drivers",  icon: IconTruck },
      { id: "jobs",     label: "Jobs",     icon: IconPackage },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "wallets",       label: "Wallets",       icon: IconWallet },
      { id: "configuration", label: "Configuration", icon: IconSliders },
    ],
  },
];

const Sidebar = ({ current, onNav, onLogout }) => (
  <aside className="sidebar">
    <div className="brand">
      <div className="logo-mark">L</div>
      <div>
        <div className="brand-name">Loada</div>
        <div className="brand-sub">Admin Console</div>
      </div>
    </div>

    {NAV.map(group => (
      <div className="nav-group" key={group.label}>
        <div className="nav-group-label">{group.label}</div>
        {group.items.map(item => {
          const I = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${current === item.id ? "active" : ""}`}
              onClick={() => onNav(item.id)}
            >
              <span className="nav-icon"><I size={16}/></span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    ))}

    <div className="sidebar-foot">
      <div className="avatar">OK</div>
      <div className="who">
        <div className="who-name">opsadmin</div>
        <div className="who-role">Admin</div>
      </div>
      <button className="icon-btn" aria-label="Log out" title="Log out" onClick={onLogout}>
        <IconLogout size={14}/>
      </button>
    </div>
  </aside>
);

Object.assign(window, { Sidebar });
