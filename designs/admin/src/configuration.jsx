/* Screen 7 — Configuration */

const SECTION_ICONS = {
  pricing: { Icon: IconDollar, color: "var(--amber)",   bg: "rgba(245,166,35,0.14)" },
  bidding: { Icon: IconGavel,  color: "var(--accent)",  bg: "rgba(79,124,255,0.14)" },
  matching:{ Icon: IconRadius, color: "var(--cyan)",    bg: "rgba(34,211,238,0.14)" },
  auth:    { Icon: IconShield, color: "var(--purple)",  bg: "rgba(167,139,250,0.14)" },
  payments:{ Icon: IconCard,   color: "var(--success)", bg: "rgba(52,211,153,0.14)" },
  market:  { Icon: IconScale,  color: "var(--orange)",  bg: "rgba(251,146,60,0.14)" },
};

const ConfigSection = ({ id, section, onSave }) => {
  const meta = SECTION_ICONS[id];
  const I = meta.Icon;
  const [editing, setEditing] = React.useState(null);
  const [draft, setDraft] = React.useState("");
  const [savedKey, setSavedKey] = React.useState(null);

  const startEdit = (item) => { setEditing(item.key); setDraft(String(item.value)); };
  const commit = (item) => {
    const num = parseFloat(draft);
    if (isNaN(num)) return;
    onSave(item.key, num);
    setEditing(null);
    setSavedKey(item.key);
    setTimeout(() => setSavedKey(k => k === item.key ? null : k), 1600);
  };

  return (
    <div className={`config-card ${section.accent}`}>
      <div className="config-head">
        <div className="ico" style={{ background: meta.bg, color: meta.color }}><I size={16}/></div>
        <div className="title">{section.label}</div>
        <div className="count">{section.items.length} keys</div>
      </div>
      <div className="config-body">
        {section.items.map(item => {
          const isEditing = editing === item.key;
          return (
            <div key={item.key} className={`row ${isEditing ? "editing" : ""}`}>
              <div className="k">{item.label}</div>
              {!isEditing && (
                <div className="v mono" onClick={() => startEdit(item)} role="button" tabIndex={0}>
                  {item.unit === "$" ? `$${item.value}` : `${item.value}${item.unit ? ` ${item.unit}` : ""}`}
                </div>
              )}
              {isEditing && (
                <>
                  <input
                    className="edit-input"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commit(item); if (e.key === "Escape") setEditing(null); }}
                    autoFocus
                  />
                  <div className="edit-actions">
                    <button className="btn ghost sm" onClick={() => setEditing(null)}>Cancel</button>
                    <button className="btn primary sm" onClick={() => commit(item)}>Save</button>
                  </div>
                </>
              )}
              {!isEditing && savedKey === item.key && (
                <span className="saved"><IconCheck size={12}/> Saved</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Configuration = () => {
  const [config, setConfig] = React.useState(() => JSON.parse(JSON.stringify(CONFIG)));

  const updateKey = (sectionId, key, value) => {
    setConfig(c => ({
      ...c,
      [sectionId]: {
        ...c[sectionId],
        items: c[sectionId].items.map(it => it.key === key ? { ...it, value } : it),
      },
    }));
  };

  return (
    <div className="main">
      <PageHead eyebrow="Platform" title="Configuration" sub="Live operational settings — changes take effect immediately" />

      <div className="config-banner">
        <IconAlert size={16}/>
        <div className="body"><strong>Live settings.</strong> Changes are applied in real time. Redis cache clears within 60 seconds.</div>
      </div>

      <div className="config-grid">
        {Object.entries(config).map(([id, section]) => (
          <ConfigSection key={id} id={id} section={section} onSave={(k, v) => updateKey(id, k, v)} />
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { Configuration });
