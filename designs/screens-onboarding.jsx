// Loada — Onboarding screens

function ScSplash() {
  return (
    <Phone hi={false} sb={false} label="01 Splash">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Wordmark size={56}/>
        <div style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 400, letterSpacing: 0.2 }}>
          Move more. Wait less.
        </div>
      </div>
      <div style={{ padding: '0 20px 60px', textAlign: 'center', color: 'var(--text-3)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        v 1.0 · Zimbabwe
      </div>
    </Phone>
  );
}

function ScRoleSelect() {
  return (
    <Phone label="02 Role">
      <div style={{ padding: '20px 24px 0' }}>
        <Wordmark size={28}/>
      </div>
      <div style={{ padding: '60px 20px 0' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.15 }}>
          What are you<br/>here to do?
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 8 }}>
          You can switch later.
        </div>
      </div>

      <div style={{ flex: 1, padding: '40px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="card" style={{
          background: 'var(--card)', textAlign: 'left', cursor: 'pointer',
          padding: 20, border: '1px solid var(--accent)',
          boxShadow: 'inset 0 0 0 1px rgba(245,166,35,0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,166,35,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.package size={22} color="var(--accent)"/>
            </div>
            <div style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>SHIPPER</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>I need a truck</div>
          <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>
            Post loads, see bids in real time, track delivery.
          </div>
        </button>

        <button className="card" style={{
          background: 'var(--card)', textAlign: 'left', cursor: 'pointer',
          padding: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--elev)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.truck size={22} color="#fff"/>
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: 11, fontWeight: 600, letterSpacing: 0.8 }}>DRIVER</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>I drive a truck</div>
          <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>
            Browse loads, bid, get paid. Flat weekly fee, no commission.
          </div>
        </button>

        <div style={{ flex: 1 }}/>
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12, marginBottom: 20 }}>
          By continuing you agree to our <span style={{ color: 'var(--text-2)' }}>Terms</span> & <span style={{ color: 'var(--text-2)' }}>Privacy</span>
        </div>
      </div>
    </Phone>
  );
}

function ScOTP() {
  const digits = ['2', '8', '4', '1', '', ''];
  return (
    <Phone label="03 OTP">
      <div style={{ padding: '12px 20px 0' }}>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <I.chevronLeft size={20}/> <span style={{ fontSize: 14 }}>Back</span>
        </button>
      </div>
      <div style={{ padding: '40px 20px 0' }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.15 }}>
          Enter the code
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 8 }}>
          We sent a 6-digit code to <span style={{ color: '#fff' }} className="num">+263 77 412 8847</span>
        </div>
      </div>
      <div style={{ padding: '48px 20px 0' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {digits.map((d, i) => (
            <div key={i} style={{
              flex: 1, height: 60, borderRadius: 8,
              background: 'var(--elev)',
              border: '1px solid ' + (d ? 'var(--divider)' : (i === 4 ? 'var(--accent)' : 'var(--divider)')),
              boxShadow: i === 4 ? '0 0 0 3px rgba(245,166,35,0.08)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: '#fff',
            }} className="num">{d}{i === 4 && <span style={{ width: 2, height: 26, background: 'var(--accent)', marginLeft: 1 }}/>}</div>
          ))}
        </div>
        <div style={{ marginTop: 28, textAlign: 'center', color: 'var(--text-2)', fontSize: 13 }}>
          Resend in <span className="num" style={{ color: '#fff' }}>0:42</span>
        </div>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button style={{ background: 'transparent', border: 0, color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
            Resend via voice call
          </button>
        </div>
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary">Verify</button>
      </div>
    </Phone>
  );
}

function ScDriverDocs() {
  const items = [
    { label: "Driver's licence (front)", state: 'done' },
    { label: "Driver's licence (back)", state: 'done' },
    { label: "Vehicle registration", state: 'review' },
    { label: "Truck photo (loaded view)", state: 'todo' },
  ];
  return (
    <Phone label="04 Docs">
      <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <I.chevronLeft size={20}/><span style={{ fontSize: 14 }}>Back</span>
        </button>
        <div style={{ color: 'var(--text-2)', fontSize: 13 }} className="num">Step 3 of 3</div>
      </div>
      <div className="progress" style={{ margin: '8px 20px 0' }}>
        <span style={{ width: '100%' }}/>
      </div>
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.2 }}>
          Upload documents
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>
          Reviewed within 24 hours. We'll text when you're approved.
        </div>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 8,
              background: it.state === 'done' ? 'rgba(0,200,83,0.12)' : it.state === 'review' ? 'rgba(245,166,35,0.12)' : 'var(--elev)',
              border: '1px solid ' + (it.state === 'done' ? 'rgba(0,200,83,0.25)' : it.state === 'review' ? 'rgba(245,166,35,0.25)' : 'var(--divider)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {it.state === 'done' ? <I.check size={20} color="var(--green)"/> :
               it.state === 'review' ? <I.clock size={18} color="var(--accent)"/> :
               <I.upload size={18} color="var(--text-2)"/>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{it.label}</div>
              <div style={{ fontSize: 12, color:
                it.state === 'done' ? 'var(--green)' :
                it.state === 'review' ? 'var(--accent)' : 'var(--text-2)',
                marginTop: 2,
              }}>
                {it.state === 'done' ? 'Verified' : it.state === 'review' ? 'Under review' : 'Tap to upload'}
              </div>
            </div>
            <I.chevronRight size={18} color="var(--text-3)"/>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginBottom: 14 }}>
          1 document remaining
        </div>
        <button className="btn-primary" disabled>Continue</button>
      </div>
    </Phone>
  );
}

function ScPaywall() {
  return (
    <Phone label="05 Paywall">
      <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)' }}>
          <I.x size={22}/>
        </button>
      </div>
      <div style={{ padding: '20px 24px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: 'rgba(245,166,35,0.12)',
          border: '1px solid rgba(245,166,35,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <I.shieldCheck size={28} color="var(--accent)"/>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.15 }}>
          You're verified.<br/>One last thing.
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 15, marginTop: 12, lineHeight: 1.5 }}>
          No commission on any load — ever. Pay a flat weekly fee to access all loads near you.
        </div>
      </div>

      <div style={{ padding: '28px 20px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { id: 'w', label: 'Weekly',  price: '$8',   sub: '/ week',  badge: null,                ee: '~$0.05 / load',  sel: false },
          { id: 'm', label: 'Monthly', price: '$28',  sub: '/ month', badge: 'SAVE 12%',          ee: '≈ $7 / week',    sel: true  },
          { id: 'a', label: 'Annual',  price: '$280', sub: '/ year',  badge: 'SAVE 32% · BEST',   ee: '≈ $5.40 / week', sel: false },
        ].map(p => (
          <div key={p.id} className="card" style={{
            padding: 16, display: 'flex', alignItems: 'center', gap: 14,
            borderColor: p.sel ? 'var(--accent)' : 'var(--divider)',
            background: p.sel ? 'rgba(245,166,35,0.04)' : 'var(--card)',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 11,
              border: '2px solid ' + (p.sel ? 'var(--accent)' : 'var(--divider)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {p.sel && <div style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--accent)' }}/>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{p.label}</span>
                {p.badge && <span className="chip amber" style={{ fontSize: 9 }}>{p.badge}</span>}
              </div>
              <div className="num" style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{p.ee}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span className="num" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>{p.price}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}>{p.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['Unlimited bids on all loads', 'No commission, ever', 'Cancel anytime'].map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <I.check size={14} color="var(--accent)"/>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '20px 20px 32px' }}>
        <button className="btn-primary">Continue · $28 / month</button>
        <div style={{ marginTop: 10, textAlign: 'center', color: 'var(--text-3)', fontSize: 11 }}>
          EcoCash · OneMoney · card · cancel anytime
        </div>
      </div>
    </Phone>
  );
}

Object.assign(window, { ScSplash, ScRoleSelect, ScOTP, ScDriverDocs, ScPaywall });
