// Loada — Shared & supporting screens

// 1. In-app chat
function ScChat() {
  const msgs = [
    { who: 'them', t: "Hi, I'm 5 min out from pickup. Loading bay 3?", time: '10:24' },
    { who: 'me', t: 'Yes bay 3, ask for Brian at the gate.', time: '10:25' },
    { who: 'them', t: "Copy. I'll send a photo once loaded.", time: '10:25' },
    { who: 'them', kind: 'image', label: 'cargo · loaded', time: '10:38' },
    { who: 'them', t: 'All 140 bags on. Heading out now.', time: '10:39' },
    { who: 'me', t: 'Thanks. Safe trip.', time: '10:40' },
  ];
  return (
    <Phone label="25 Chat">
      <div className="appbar" style={{ borderBottom: '1px solid var(--divider)', paddingBottom: 12 }}>
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name="Tatenda M" size={32}/>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Tatenda M.</div>
            <div style={{ fontSize: 11, color: 'var(--green)' }}>● in transit</div>
          </div>
        </div>
        <button style={{ background: 'transparent', border: 0, color: 'var(--accent)' }}>
          <I.phone size={20}/>
        </button>
      </div>

      {/* job context strip */}
      <div style={{ padding: '10px 20px', background: 'var(--elev)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--divider)' }}>
        <I.package size={14} color="var(--accent)"/>
        <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
          <span style={{ color: '#fff' }}>HRE → BBE · 10t cement</span> · job <span className="num">L-49118</span>
        </div>
      </div>

      <div className="scrolly" style={{ padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.who === 'me' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '78%',
              padding: m.kind === 'image' ? 4 : '10px 12px',
              background: m.who === 'me' ? 'var(--accent)' : 'var(--card)',
              border: m.who === 'me' ? 'none' : '1px solid var(--divider)',
              color: m.who === 'me' ? '#0A0A0A' : '#fff',
              borderRadius: 14,
              borderBottomRightRadius: m.who === 'me' ? 4 : 14,
              borderBottomLeftRadius: m.who === 'me' ? 14 : 4,
              fontSize: 14, lineHeight: 1.4,
            }}>
              {m.kind === 'image' ? (
                <ImgBox w={180} h={140} label={m.label} radius={10}/>
              ) : (
                <span>{m.t}</span>
              )}
              <div className="num" style={{ fontSize: 10, opacity: 0.6, marginTop: 4, textAlign: 'right', color: m.who === 'me' ? '#0A0A0A' : 'var(--text-2)' }}>
                {m.time}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div style={{ padding: '12px 16px 24px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--divider)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--elev)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.plus size={18}/>
        </div>
        <div style={{
          flex: 1, height: 40, borderRadius: 20,
          background: 'var(--elev)', border: '1px solid var(--divider)',
          display: 'flex', alignItems: 'center', padding: '0 14px',
          fontSize: 13, color: 'var(--text-3)',
        }}>Message</div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--elev)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.mic size={18} color="var(--accent)"/>
        </div>
      </div>
    </Phone>
  );
}

// 2. Notifications centre
function ScNotifications() {
  const groups = [
    {
      title: 'Job L-49118 · Avondale → Beitbridge',
      items: [
        { kind: 'load', text: 'Delivered. POD ready to download.', time: '6:09 PM', accent: true },
        { kind: 'truck', text: 'Cargo loaded — heading to Beitbridge.', time: '10:38 AM' },
        { kind: 'check', text: 'Match confirmed with Tatenda M.', time: '10:14 AM' },
      ],
    },
    {
      title: 'Job L-49102 · Workington → Bulawayo',
      items: [
        { kind: 'bell', text: '3 new bids on your load (low $720).', time: 'Yesterday' },
      ],
    },
    {
      title: 'Account',
      items: [
        { kind: 'shield', text: 'Vehicle registration expires in 27 days.', time: '2d ago' },
        { kind: 'wallet', text: 'Subscription auto-renews 19 Jun ($28).', time: '3d ago' },
      ],
    },
  ];
  const iconFor = (k) => ({
    load: <I.check size={16} color="var(--green)"/>,
    truck: <I.truck size={16} color="var(--accent)"/>,
    check: <I.check size={16} color="#fff"/>,
    bell: <I.bell size={16} color="var(--accent)"/>,
    shield: <I.alertTriangle size={16} color="var(--amber)"/>,
    wallet: <I.wallet size={16} color="var(--text-2)"/>,
  })[k];

  return (
    <Phone label="26 Notifications">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>Notifications</div>
        <button style={{ background: 'transparent', border: 0, color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>Mark read</button>
      </div>

      <div className="scrolly">
        {groups.map((g, gi) => (
          <div key={gi} style={{ marginTop: gi === 0 ? 8 : 24 }}>
            <div style={{ padding: '0 20px 8px', fontSize: 11, color: 'var(--text-2)', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {g.title}
            </div>
            <div>
              {g.items.map((it, ii) => (
                <div key={ii} style={{
                  padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: it.accent ? 'rgba(245,166,35,0.04)' : 'transparent',
                  borderTop: '1px solid var(--divider)',
                  borderBottom: ii === g.items.length - 1 ? '1px solid var(--divider)' : 'none',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 16,
                    background: 'var(--elev)', border: '1px solid var(--divider)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{iconFor(it.kind)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>{it.text}</div>
                    <div className="num" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{it.time}</div>
                  </div>
                  {it.accent && <div style={{ width: 7, height: 7, borderRadius: 4, background: 'var(--accent)', marginTop: 4 }}/>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

// 3. Profile (driver) — combines profile + docs + subscription teaser
function ScDriverProfile() {
  return (
    <Phone label="27 Profile · Driver">
      <div className="appbar">
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Profile</div>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)' }}>
          <I.settings size={20}/>
        </button>
      </div>

      <div className="scrolly">
        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name="Tatenda M" size={64}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Tatenda Mukamuri</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Stars rating={4.9} count={312} size={11}/>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }} className="num">Member since Mar 2022 · 287 jobs</div>
          </div>
        </div>

        {/* Live job ribbon */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'var(--green)', background: 'rgba(0,200,83,0.04)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--green)', boxShadow: '0 0 0 4px rgba(0,200,83,0.2)' }}/>
            <div style={{ flex: 1, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>In transit</span> · Beitbridge in 4h 12m
            </div>
            <I.chevronRight size={16} color="var(--text-2)"/>
          </div>
        </div>

        <div className="section-label">VEHICLE</div>
        <div style={{ padding: '0 20px' }}>
          <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <ImgBox w={56} h={42} label="truck" radius={4}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>DAF CF 10t</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }} className="num">2017 · AEK-4421</div>
            </div>
            <span className="chip amber">10t</span>
          </div>
        </div>

        <div className="section-label">DOCUMENTS</div>
        <div style={{ padding: '0 16px' }}>
          {[
            { name: "Driver's licence", state: 'ok', exp: 'Exp Aug 2027' },
            { name: 'Vehicle registration', state: 'soon', exp: 'Exp 27 Jun · 27 days' },
          ].map((d, i) => (
            <div key={i} style={{
              padding: 14, marginBottom: 8, borderRadius: 12,
              background: 'var(--card)', border: '1px solid ' + (d.state === 'soon' ? 'rgba(255,179,0,0.3)' : 'var(--divider)'),
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: d.state === 'ok' ? 'rgba(0,200,83,0.12)' : 'rgba(255,179,0,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {d.state === 'ok' ? <I.check size={18} color="var(--green)"/> : <I.alertTriangle size={18} color="var(--amber)"/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: d.state === 'ok' ? 'var(--text-2)' : 'var(--amber)', marginTop: 2 }}>{d.exp}</div>
              </div>
              <I.chevronRight size={16} color="var(--text-3)"/>
            </div>
          ))}
        </div>

        <div className="section-label">SUBSCRIPTION</div>
        <div style={{ padding: '0 20px 24px' }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Driver · monthly</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>Renews 19 Jun</div>
              </div>
              <div className="num" style={{ fontSize: 20, fontWeight: 700 }}>$28</div>
            </div>
            <div className="hr" style={{ margin: '12px -8px' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-2)' }}>EcoCash · 077••8847</span>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Manage</span>
            </div>
          </div>
        </div>
      </div>

      <TabBar active="profile" role="driver"/>
    </Phone>
  );
}

// 4. Help — WhatsApp-first
function ScHelp() {
  const topics = [
    { ic: I.helpCircle, t: 'How bidding works' },
    { ic: I.wallet, t: 'Payments & subscriptions' },
    { ic: I.alertTriangle, t: 'Dispute a job' },
    { ic: I.file, t: 'Update documents' },
    { ic: I.shield, t: 'Safety on the road' },
  ];
  return (
    <Phone label="28 Help">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Help</div>
        <div style={{ width: 22 }}/>
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <div className="input" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
          <I.search size={16} color="var(--text-3)"/>
          <span>Search articles…</span>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div style={{ padding: '20px 20px 0' }}>
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, borderColor: 'rgba(0,200,83,0.3)', background: 'rgba(0,200,83,0.04)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(0,200,83,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.message size={22} color="var(--green)"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Chat with support on WhatsApp</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>Typical reply <span className="num" style={{ color: '#fff' }}>under 8 min</span></div>
          </div>
          <I.arrowRight size={18} color="var(--green)"/>
        </div>
      </div>

      <div className="section-label">BROWSE TOPICS</div>
      <div style={{ padding: '0 16px' }}>
        {topics.map((t, i) => {
          const Ic = t.ic;
          return (
            <div key={i} style={{
              padding: 14, display: 'flex', alignItems: 'center', gap: 12,
              borderTop: '1px solid var(--divider)',
              borderBottom: i === topics.length - 1 ? '1px solid var(--divider)' : 'none',
            }}>
              <Ic size={20} color="var(--text-2)"/>
              <div style={{ flex: 1, fontSize: 14 }}>{t.t}</div>
              <I.chevronRight size={16} color="var(--text-3)"/>
            </div>
          );
        })}
      </div>

      <div className="section-label">URGENT</div>
      <div style={{ padding: '0 20px 24px' }}>
        <button className="btn-dark" style={{ background: 'rgba(244,67,54,0.08)', borderColor: 'rgba(244,67,54,0.3)', color: 'var(--red)' }}>
          <I.alertTriangle size={16}/> Report a safety concern
        </button>
      </div>
    </Phone>
  );
}

// 5. Empty state — "no bids yet" (the brief calls these out)
function ScEmptyBids() {
  return (
    <Phone label="29 Empty · Bids">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Waiting for bids</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Harare → Beitbridge · $480</div>
        </div>
        <div style={{ width: 22 }}/>
      </div>

      <div style={{ margin: '0 20px', position: 'relative' }}>
        <div className="progress"><span style={{ width: '70%' }}/></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-2)' }}>
          <span><span className="num" style={{ color: 'var(--accent)', fontWeight: 600 }}>0 bids</span> · expanding to 75 km</span>
          <span className="num">0:54 left</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        {/* pulse ring */}
        <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 24 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(245,166,35,0.2)' }}/>
          <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', border: '1px solid rgba(245,166,35,0.3)' }}/>
          <div style={{ position: 'absolute', inset: 24, borderRadius: '50%', border: '1px solid rgba(245,166,35,0.5)' }}/>
          <div style={{ position: 'absolute', inset: 40, borderRadius: '50%', background: 'rgba(245,166,35,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.truck size={22} color="var(--accent)"/>
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>Pinging nearby drivers</div>
        <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
          12 drivers within 25 km saw your load. Bids usually come in within 2 minutes.
        </div>
      </div>

      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-dark">Raise asking price by $20</button>
        <div style={{ height: 8 }}/>
        <div style={{ textAlign: 'center' }}>
          <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', fontSize: 13 }}>Cancel load</button>
        </div>
      </div>
    </Phone>
  );
}

// 6. Counter-offer modal (over bid inbox dimmed)
function ScCounter() {
  return (
    <Phone label="30 Counter">
      {/* Dimmed background mimic of bid inbox */}
      <div style={{ position: 'absolute', inset: 0, background: '#0A0A0A' }}>
        <Statusbar/>
        <div className="appbar">
          <I.chevronLeft size={22} color="var(--text-3)"/>
          <div style={{ textAlign: 'center', opacity: 0.4 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Bids coming in</div>
          </div>
          <div style={{ width: 22 }}/>
        </div>
        <div style={{ padding: '16px', opacity: 0.18 }}>
          {[0,1,2].map(i => (
            <div key={i} className="card" style={{ marginBottom: 10, padding: 14, height: 80 }}/>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(2px)' }}/>

      {/* Sheet */}
      <div style={{ flex: 1 }}/>
      <div className="sheet" style={{ position: 'relative', zIndex: 10 }}>
        <div className="handle"/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <Avatar name="Tatenda M" size={44}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Counter to Tatenda</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
              They bid <span className="num" style={{ color: '#fff' }}>$465</span>
            </div>
          </div>
        </div>

        <div className="input-label" style={{ textAlign: 'center', marginBottom: 12 }}>YOUR COUNTER</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
          <span style={{ color: 'var(--text-2)', fontSize: 22, fontWeight: 400 }}>$</span>
          <span className="num" style={{ fontSize: 60, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1 }}>440</span>
        </div>
        <div style={{ marginTop: 8, textAlign: 'center', color: 'var(--text-2)', fontSize: 12 }}>
          <span className="num" style={{ color: 'var(--green)' }}>−$25</span> from their bid
        </div>

        {/* quick chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'center' }}>
          {['$420', '$430', '$440', '$450'].map(p => (
            <div key={p} className={'pill ' + (p === '$440' ? 'on' : '')} style={{ height: 32, fontSize: 12 }}>{p}</div>
          ))}
        </div>

        <div style={{ marginTop: 22, padding: 12, background: 'var(--elev)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.clock size={14} color="var(--text-2)"/>
          Driver has <span className="num" style={{ color: '#fff', fontWeight: 600 }}>30s</span> to accept or counter back.
        </div>

        <div style={{ height: 16 }}/>
        <button className="btn-primary">Send counter · $440</button>
      </div>
    </Phone>
  );
}

Object.assign(window, {
  ScChat, ScNotifications, ScDriverProfile, ScHelp, ScEmptyBids, ScCounter,
});
