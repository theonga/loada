// Loada — Shipper flow screens

// 1. Shipper home (map + prompt)
function ScShipperHome() {
  return (
    <Phone label="06 Shipper Home">
      <MapBg>
        <div className="scrim-top"/>
        <div className="scrim-bottom"/>

        {/* Live pins */}
        <MapPin x={120} y={280} kind="me"/>
        <MapPin x={220} y={200} kind="driver" scale={0.8}/>
        <MapPin x={90} y={460} kind="driver" scale={0.8}/>
        <MapPin x={290} y={420} kind="driver" scale={0.8}/>
      </MapBg>

      {/* Top bar */}
      <div className="appbar" style={{ position: 'relative', zIndex: 10 }}>
        <div>
          <div style={{ color: 'var(--text-2)', fontSize: 12 }}>Good morning</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Tendai</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--card)', border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <I.bell size={18}/>
            <div style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, background: 'var(--accent)', border: '1.5px solid var(--card)' }}/>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Floating prompt card */}
      <div style={{ position: 'relative', zIndex: 10, padding: '0 16px 16px' }}>
        {/* Past jobs strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflow: 'hidden' }}>
          {[
            { from: 'Harare', to: 'Mutare', t: '2d' },
            { from: 'Bulawayo', to: 'Harare', t: '1w' },
            { from: 'Harare', to: 'Beitbridge', t: '2w' },
          ].map((j, i) => (
            <div key={i} style={{
              padding: '8px 12px', background: 'rgba(20,20,20,0.85)',
              border: '1px solid var(--divider)', borderRadius: 8,
              backdropFilter: 'blur(10px)',
              whiteSpace: 'nowrap', fontSize: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontWeight: 500 }}>
                <span>{j.from}</span>
                <I.arrowRight size={10} color="var(--text-3)"/>
                <span>{j.to}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }} className="num">{j.t} ago · repeat</div>
            </div>
          ))}
        </div>

        {/* Where to */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: 16, gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.plus size={22} color="#0A0A0A" stroke={2.4}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Where to?</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Post a load — drivers bid in minutes</div>
            </div>
            <I.chevronRight size={20} color="var(--text-3)"/>
          </div>
        </div>
      </div>

      <TabBar active="home" role="shipper"/>
    </Phone>
  );
}

// 2. Post-a-load Route
function ScPostRoute() {
  return (
    <Phone label="07 Post · Route">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0, display: 'flex', alignItems: 'center' }}>
          <I.x size={22}/>
        </button>
        <div style={{ color: 'var(--text-2)', fontSize: 13 }} className="num">1 / 4</div>
        <div style={{ width: 22 }}/>
      </div>
      <div className="progress" style={{ margin: '0 20px' }}><span style={{ width: '25%' }}/></div>

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Route</div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ position: 'relative', paddingLeft: 24 }}>
          {/* Dot column */}
          <div style={{ position: 'absolute', left: 8, top: 22, bottom: 22, width: 1, background: 'var(--divider)' }}/>
          <div style={{ position: 'absolute', left: 4, top: 18, width: 10, height: 10, borderRadius: 5, background: '#fff' }}/>
          <div style={{ position: 'absolute', left: 4, bottom: 18, width: 10, height: 10, background: 'var(--accent)' }}/>

          <div className="input-group" style={{ marginBottom: 12 }}>
            <div className="input-label">PICKUP</div>
            <div className="input focus" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 500 }}>Avondale Shops, Harare</span>
            </div>
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <div className="input-label">DROPOFF</div>
            <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-2)' }}>
              <span>Beitbridge border post</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini map preview */}
      <div style={{ margin: '20px 20px 0', borderRadius: 12, overflow: 'hidden', position: 'relative', height: 180, border: '1px solid var(--divider)' }}>
        <MapBg variant="b">
          <MapPin x={80} y={50} kind="origin"/>
          <MapPin x={280} y={140} kind="dest"/>
          <RouteLine a={{x: 80, y: 50}} b={{x: 280, y: 140}}/>
        </MapBg>
      </div>

      <div style={{ padding: '14px 20px 0', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: 1, textTransform: 'uppercase' }}>Distance</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>583 <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>km</span></div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: 1, textTransform: 'uppercase' }}>Drive time</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>7h 40<span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 400 }}>m</span></div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: 1, textTransform: 'uppercase' }}>Tolls</div>
          <div className="num" style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>$24</div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary">Continue <I.arrowRight size={18} stroke={2.4}/></button>
      </div>
    </Phone>
  );
}

// 3. Post-a-load Cargo details
function ScPostCargo() {
  const tonnages = ['1t', '2t', '5t', '10t', '20t', '30t+'];
  const reqs = [
    { id: 'frag', label: 'Fragile', icon: I.alertTriangle, on: false },
    { id: 'ref', label: 'Refrigerated', icon: I.snowflake, on: false },
    { id: 'over', label: 'Oversized', icon: I.move, on: true },
    { id: 'haz', label: 'Hazardous', icon: I.shieldAlert, on: false },
  ];
  return (
    <Phone label="08 Post · Cargo">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ color: 'var(--text-2)', fontSize: 13 }} className="num">2 / 4</div>
        <div style={{ width: 22 }}/>
      </div>
      <div className="progress" style={{ margin: '0 20px' }}><span style={{ width: '50%' }}/></div>

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>What are you moving?</div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div className="input-group">
          <div className="input-label">CARGO</div>
          <div className="input focus" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>140 bags of cement</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div className="input-label" style={{ marginBottom: 10 }}>WEIGHT</div>
        <div className="pill-row">
          {tonnages.map(t => (
            <div key={t} className={'pill ' + (t === '10t' ? 'on' : '')}>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div className="input-label" style={{ marginBottom: 10 }}>SPECIAL HANDLING</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {reqs.map(r => {
            const Ic = r.icon;
            return (
              <div key={r.id} className="card" style={{
                padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                borderColor: r.on ? 'var(--accent)' : 'var(--divider)',
                background: r.on ? 'rgba(245,166,35,0.06)' : 'var(--card)',
              }}>
                <Ic size={18} color={r.on ? 'var(--accent)' : 'var(--text-2)'}/>
                <span style={{ fontWeight: 500, color: r.on ? 'var(--accent)' : 'var(--text-2)', fontSize: 13 }}>{r.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary">Continue <I.arrowRight size={18} stroke={2.4}/></button>
      </div>
    </Phone>
  );
}

// 4. Post-a-load Pricing — KEY differentiator (market reference)
function ScPostPricing() {
  return (
    <Phone label="09 Post · Pricing">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ color: 'var(--text-2)', fontSize: 13 }} className="num">3 / 4</div>
        <div style={{ width: 22 }}/>
      </div>
      <div className="progress" style={{ margin: '0 20px' }}><span style={{ width: '75%' }}/></div>

      <div style={{ padding: '24px 20px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Set your price</div>
        <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 6 }}>
          What you're willing to pay. Drivers will bid against this.
        </div>
      </div>

      {/* Big price input */}
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
          <span style={{ color: 'var(--text-2)', fontSize: 28, fontWeight: 400 }}>$</span>
          <span className="num" style={{ fontSize: 72, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>480</span>
          <span style={{ display: 'inline-block', width: 3, height: 64, background: 'var(--accent)', marginLeft: 2 }}/>
        </div>
        <div style={{ marginTop: 8, color: 'var(--text-3)', fontSize: 12 }}>USD · paid direct to driver on delivery</div>
      </div>

      {/* Market reference widget — the differentiator */}
      <div style={{ padding: '32px 20px 0' }}>
        <div className="card" style={{ background: 'var(--card)', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div className="eyebrow">MARKET REFERENCE</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-2)' }}>
                Harare → Beitbridge · 10t · last 30 days
              </div>
            </div>
            <I.trendingUp size={18} color="var(--text-3)"/>
          </div>

          {/* range bar */}
          <div style={{ position: 'relative', height: 32, marginTop: 8 }}>
            {/* track */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 14, height: 4, background: 'var(--elev)', borderRadius: 2 }}/>
            {/* range */}
            <div style={{ position: 'absolute', left: '20%', width: '55%', top: 14, height: 4, background: 'var(--accent)', borderRadius: 2 }}/>
            {/* low */}
            <div style={{ position: 'absolute', left: '20%', top: 8, transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: 8, background: 'var(--accent)', border: '3px solid var(--card)' }}/>
            {/* high */}
            <div style={{ position: 'absolute', left: '75%', top: 8, transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: 8, background: 'var(--accent)', border: '3px solid var(--card)' }}/>
            {/* user marker */}
            <div style={{ position: 'absolute', left: '52%', top: -4, transform: 'translateX(-50%)' }}>
              <div style={{ width: 2, height: 24, background: '#fff', margin: '0 auto' }}/>
              <div style={{ fontSize: 10, color: '#fff', fontWeight: 600, marginTop: 2, textAlign: 'center' }} className="num">YOU</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <div>
              <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>$420</div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.5 }}>LOW</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>$465</div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.5 }}>MEDIAN · 47 jobs</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>$540</div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.5 }}>HIGH</div>
            </div>
          </div>

          <div className="hr" style={{ margin: '14px -8px 12px' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)' }}>
            <I.zap size={14} color="var(--accent)"/>
            Likely to match in <span className="num" style={{ color: '#fff', fontWeight: 600 }}>4–7 min</span> at your price
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary">Post load · $480</button>
      </div>
    </Phone>
  );
}

// 5. Bid Inbox — THE core competitive screen — Variation A (dense list)
function ScBidInboxA() {
  const bids = [
    {
      name: 'Tatenda M.', initials: 'TM', rating: 4.9, reviews: 312, years: 4,
      truck: '10t · DAF CF', price: 465, time: '12s ago',
      accent: true, badge: 'BEST MATCH',
    },
    {
      name: 'Joseph K.', initials: 'JK', rating: 4.7, reviews: 184, years: 2,
      truck: '12t · Iveco', price: 475, time: '38s ago',
    },
    {
      name: 'Rufaro N.', initials: 'RN', rating: 4.8, reviews: 88, years: 1,
      truck: '10t · Hino', price: 490, time: '1m ago',
    },
    {
      name: 'Brighton C.', initials: 'BC', rating: 4.6, reviews: 421, years: 6,
      truck: '15t · Volvo', price: 510, time: '2m ago',
    },
  ];
  return (
    <Phone label="10 Bids · List">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Bids coming in</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Harare → Beitbridge · $480</div>
        </div>
        <div style={{ width: 22 }}/>
      </div>

      {/* TTL countdown */}
      <div style={{ margin: '0 20px', position: 'relative' }}>
        <div className="progress"><span style={{ width: '38%' }}/></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-2)' }}>
          <span><span className="num" style={{ color: 'var(--accent)', fontWeight: 600 }}>4 bids</span> · expanding to 50km</span>
          <span className="num">1:52 left</span>
        </div>
      </div>

      <div className="scrolly" style={{ marginTop: 16 }}>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {bids.map((b, i) => (
            <div key={i} className="card" style={{
              padding: 14,
              borderColor: b.accent ? 'var(--accent)' : 'var(--divider)',
              background: b.accent ? 'rgba(245,166,35,0.04)' : 'var(--card)',
            }}>
              {b.badge && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--accent)' }}/>
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, letterSpacing: 1 }}>{b.badge}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <Avatar name={b.name} size={44}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{b.name}</div>
                    <div className="num" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>${b.price}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                    <Stars rating={b.rating} count={b.reviews} size={11}/>
                    <span style={{ color: 'var(--text-3)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }} className="num">{b.years}y on Loada</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <ImgBox w={48} h={36} label="truck" radius={4}/>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{b.truck}</div>
                    <div style={{ flex: 1 }}/>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }} className="num">{b.time}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button style={{
                  flex: 1, height: 40, borderRadius: 8,
                  background: 'var(--green)', color: '#0A0A0A', border: 0,
                  fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
                }}>Accept ${b.price}</button>
                <button style={{
                  flex: 1, height: 40, borderRadius: 8,
                  background: 'transparent', color: '#fff',
                  border: '1px solid var(--divider)',
                  fontWeight: 500, fontSize: 14, fontFamily: 'inherit',
                }}>Counter</button>
                <button style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: 'transparent', color: 'var(--text-2)',
                  border: '1px solid var(--divider)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><I.x size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

// 5b. Bid Inbox — Variation B (terminal — rank-ordered, sortable)
function ScBidInboxB() {
  const bids = [
    { rank: 1, name: 'Tatenda M.', rating: 4.9, price: 465, years: 4, truck: '10t DAF', dist: '2.4km' },
    { rank: 2, name: 'Joseph K.',  rating: 4.7, price: 475, years: 2, truck: '12t Iveco', dist: '5.1km' },
    { rank: 3, name: 'Rufaro N.',  rating: 4.8, price: 490, years: 1, truck: '10t Hino', dist: '8.0km' },
    { rank: 4, name: 'Brighton C.',rating: 4.6, price: 510, years: 6, truck: '15t Volvo', dist: '12.3km' },
    { rank: 5, name: 'Munashe T.', rating: 4.4, price: 520, years: 3, truck: '10t DAF', dist: '14.8km' },
    { rank: 6, name: 'Kuda P.',    rating: 4.9, price: 540, years: 5, truck: '20t Scania', dist: '18.2km' },
  ];
  return (
    <Phone label="11 Bids · Terminal">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>HRE → BBE</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }} className="num">Ref $480 · 10t cement</div>
        </div>
        <div style={{ width: 22 }}/>
      </div>

      {/* terminal stats strip */}
      <div style={{ margin: '8px 16px 0', padding: 12, background: 'var(--card)', borderRadius: 8, border: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--text-3)' }}>BIDS</div>
          <div className="num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>6</div>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--text-3)' }}>LOW</div>
          <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>$465</div>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--text-3)' }}>MED</div>
          <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>$500</div>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--text-3)' }}>HIGH</div>
          <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>$540</div>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 1, color: 'var(--text-3)' }}>TTL</div>
          <div className="num" style={{ fontSize: 18, fontWeight: 700 }}>1:52</div>
        </div>
      </div>

      {/* sort header */}
      <div style={{ display: 'flex', padding: '16px 20px 8px', fontSize: 10, color: 'var(--text-3)', letterSpacing: 1 }}>
        <span style={{ width: 28 }}>#</span>
        <span style={{ flex: 1 }}>DRIVER</span>
        <span style={{ width: 60, textAlign: 'right' }}>RATING</span>
        <span style={{ width: 72, textAlign: 'right', color: 'var(--accent)' }}>PRICE ↓</span>
      </div>
      <div className="hr" style={{ margin: '0 20px' }}/>

      <div className="scrolly">
        {bids.map(b => (
          <div key={b.rank}>
            <div style={{
              padding: '14px 20px', display: 'flex', alignItems: 'center',
              background: b.rank === 1 ? 'rgba(245,166,35,0.04)' : 'transparent',
              borderLeft: b.rank === 1 ? '2px solid var(--accent)' : '2px solid transparent',
            }}>
              <span className="num" style={{ width: 28, color: b.rank === 1 ? 'var(--accent)' : 'var(--text-3)', fontWeight: 700, fontSize: 13 }}>{String(b.rank).padStart(2, '0')}</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Avatar name={b.name} size={28}/>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)' }} className="num">{b.truck} · {b.dist}</div>
                </div>
              </div>
              <span className="num" style={{ width: 60, textAlign: 'right', fontSize: 13, color: '#fff' }}>{b.rating} <span style={{ color: 'var(--text-3)' }}>★</span></span>
              <span className="num" style={{ width: 72, textAlign: 'right', fontWeight: 700, fontSize: 16 }}>${b.price}</span>
            </div>
            <div className="hr" style={{ margin: '0 20px' }}/>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 20px 28px', display: 'flex', gap: 8 }}>
        <button className="btn-dark" style={{ flex: 1 }}>Counter top bid</button>
        <button className="btn-primary" style={{ flex: 1 }}>Accept $465</button>
      </div>
    </Phone>
  );
}

// 6. Match confirmed
function ScMatchConfirmed() {
  return (
    <Phone label="12 Match">
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(180deg, rgba(245,166,35,0.18) 0%, rgba(245,166,35,0) 100%)' }}/>

      <div className="appbar">
        <div style={{ width: 22 }}/>
        <div style={{ width: 22 }}/>
      </div>

      <div style={{ padding: '40px 20px 0', position: 'relative' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 28,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.check size={32} color="#0A0A0A" stroke={3}/>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginTop: 20 }}>
          Matched
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>
          Tatenda is heading to your pickup point.
        </div>
      </div>

      <div style={{ padding: '32px 20px 0' }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name="Tatenda M" size={56}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600 }}>Tatenda M.</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Stars rating={4.9} count={312} size={11}/>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>$465</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>agreed</div>
            </div>
          </div>

          <div className="hr" style={{ margin: '18px -4px 16px' }}/>

          <ImgBox w="100%" h={120} label="truck · 10t DAF CF · AEK-4421" radius={8}/>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: 0.5 }}>CAPACITY</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>10 tonnes</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: 0.5 }}>ETA TO PICKUP</div>
              <div className="num" style={{ fontWeight: 700, fontSize: 14, marginTop: 2, color: 'var(--accent)' }}>14 min</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: 0.5 }}>DISTANCE</div>
              <div className="num" style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>5.2 km</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary">Track driver</button>
        <div style={{ height: 8 }}/>
        <div className="btn-row">
          <button className="btn-dark"><I.message size={16}/> Message</button>
          <button className="btn-dark"><I.phone size={16}/> Call</button>
        </div>
      </div>
    </Phone>
  );
}

// 7. Active job — tracking
function ScShipperTracking() {
  return (
    <Phone label="13 Tracking">
      <MapBg>
        <RouteLine a={{x: 60, y: 160}} b={{x: 220, y: 380}} dashed/>
        <MapPin x={60} y={160} kind="driver" scale={1}/>
        <MapPin x={220} y={380} kind="origin"/>
      </MapBg>

      <div className="appbar" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(10px)', border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.chevronLeft size={20}/>
        </div>
        <div style={{ padding: '8px 14px', background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(10px)', borderRadius: 20, border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--green)' }}/>
          <span style={{ fontSize: 12, fontWeight: 500 }}>En route to pickup</span>
        </div>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ flex: 1 }}/>

      {/* Bottom sheet */}
      <div className="sheet" style={{ position: 'relative' }}>
        <div className="handle"/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <Avatar name="Tatenda M" size={48}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Tatenda M.</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>10t DAF CF · <span className="num">AEK-4421</span></div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--elev)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.message size={18}/>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.phone size={18} color="#0A0A0A"/>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderTop: '1px solid var(--divider)', borderBottom: '1px solid var(--divider)' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.8 }}>ETA</div>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 2, color: 'var(--accent)' }}>9 min</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.8 }}>DISTANCE</div>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>3.1 km</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.8 }}>SPEED</div>
            <div className="num" style={{ fontSize: 24, fontWeight: 700, marginTop: 2 }}>58<span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 400 }}> km/h</span></div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginTop: 18, position: 'relative', paddingLeft: 22 }}>
          <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 1, background: 'var(--divider)' }}/>
          {[
            { t: 'Match confirmed', tm: '10:14', done: true },
            { t: 'Driver en route', tm: 'now', done: true, active: true },
            { t: 'Cargo loaded', tm: '~10:35', done: false },
            { t: 'Delivered', tm: '~18:15', done: false },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                position: 'absolute', left: 2, width: 12, height: 12, borderRadius: 6,
                background: s.active ? 'var(--accent)' : s.done ? '#fff' : 'var(--elev)',
                border: '2px solid var(--card)',
                boxShadow: s.active ? '0 0 0 3px rgba(245,166,35,0.2)' : 'none',
              }}/>
              <div style={{ fontSize: 13, color: s.done || s.active ? '#fff' : 'var(--text-3)', fontWeight: s.active ? 600 : 400 }}>{s.t}</div>
              <div style={{ flex: 1 }}/>
              <div className="num" style={{ fontSize: 11, color: 'var(--text-2)' }}>{s.tm}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', fontSize: 12, fontWeight: 500 }}>Report an issue</button>
        </div>
      </div>
    </Phone>
  );
}

// 8. POD — Proof of delivery
function ScPOD() {
  return (
    <Phone label="14 POD">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Proof of delivery</div>
        <button style={{ background: 'transparent', border: 0, color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>PDF</button>
      </div>

      <div className="scrolly">
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.check size={16} color="#0A0A0A" stroke={3}/>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>Delivered</div>
          </div>
          <div style={{ color: 'var(--text-2)', fontSize: 13 }}>
            <span className="num">Today, 18:09</span> · Beitbridge border post
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <ImgBox w="100%" h={180} label="cargo · delivered" radius={10}/>
        </div>

        <div style={{ padding: '16px 20px 0' }}>
          <div className="card" style={{ padding: 0 }}>
            {[
              ['Job', 'L-49118'],
              ['Route', 'Harare → Beitbridge'],
              ['Cargo', '140 bags cement · 10t'],
              ['Driver', 'Tatenda M. · AEK-4421'],
              ['Pickup', 'Today 10:38'],
              ['Delivery', 'Today 18:09'],
              ['Recipient', 'B. Sibanda (signed)'],
              ['Agreed price', '$465'],
            ].map(([k, v], i, arr) => (
              <div key={i} style={{
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                borderBottom: i < arr.length - 1 ? '1px solid var(--divider)' : 'none',
                fontSize: 13,
              }}>
                <span style={{ color: 'var(--text-2)' }}>{k}</span>
                <span style={{ color: '#fff', fontWeight: 500 }} className={k === 'Agreed price' || k === 'Job' ? 'num' : ''}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '16px 20px 0' }}>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: 0.6 }}>GPS STAMP</div>
              <div className="num" style={{ fontSize: 13, marginTop: 2 }}>-22.21662, 30.00251</div>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--divider)' }}>
              <MapBg variant="c">
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: 4, background: 'var(--accent)' }}/>
              </MapBg>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px 24px' }}>
          <button className="btn-primary"><I.download size={18}/> Download PDF receipt</button>
          <div style={{ height: 8 }}/>
          <button className="btn-dark"><I.share size={16}/> Share with client</button>
        </div>
      </div>
    </Phone>
  );
}

// 9. Rate driver
function ScRateDriver() {
  const tags = ['On time', 'Careful with cargo', 'Professional', 'Good comms', 'Clean truck', 'Helpful'];
  return (
    <Phone label="15 Rate">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: 'var(--text-2)', fontSize: 14 }}>Skip</button>
        <div/>
        <div style={{ width: 22 }}/>
      </div>

      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <Avatar name="Tatenda M" size={88}/>
      </div>
      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>How was Tatenda?</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>Your rating builds trust on Loada.</div>
      </div>

      <div style={{ padding: '32px 20px 0', display: 'flex', justifyContent: 'center', gap: 12 }}>
        {[1,2,3,4,5].map(n => (
          <I.star key={n} size={36} color={n <= 5 ? 'var(--accent)' : 'var(--text-3)'}/>
        ))}
      </div>

      <div style={{ padding: '28px 20px 0' }}>
        <div className="input-label" style={{ marginBottom: 10, textAlign: 'center' }}>QUICK FEEDBACK</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {tags.map((t, i) => (
            <div key={t} className={'pill ' + (i < 3 ? 'on' : '')} style={{ height: 32, fontSize: 12 }}>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <textarea placeholder="Anything else? (optional)" style={{
          width: '100%', height: 80, background: 'var(--elev)',
          border: '1px solid var(--divider)', borderRadius: 8,
          padding: 14, color: '#fff', fontFamily: 'inherit', fontSize: 14,
          resize: 'none', outline: 'none',
        }}/>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary">Submit rating</button>
      </div>
    </Phone>
  );
}

Object.assign(window, {
  ScShipperHome, ScPostRoute, ScPostCargo, ScPostPricing,
  ScBidInboxA, ScBidInboxB, ScMatchConfirmed,
  ScShipperTracking, ScPOD, ScRateDriver,
});
