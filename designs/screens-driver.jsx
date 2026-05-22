// Loada — Driver flow screens

// 1. Driver home — map
function ScDriverHome() {
  return (
    <Phone label="16 Driver Home">
      <MapBg>
        {/* Available load pins */}
        <MapPin x={90} y={200} kind="load" label="10t"/>
        <MapPin x={250} y={250} kind="load" label="5t" active/>
        <MapPin x={140} y={360} kind="load" label="20t"/>
        <MapPin x={290} y={420} kind="load" label="2t"/>
        <MapPin x={80} y={490} kind="load" label="15t"/>
        {/* Driver self */}
        <MapPin x={190} y={580} kind="me"/>
      </MapBg>

      {/* Top bar */}
      <div className="appbar" style={{ position: 'relative', zIndex: 10, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(10px)', borderRadius: 999, border: '1px solid var(--divider)' }}>
          <div style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.power size={12} color="#0A0A0A" stroke={3}/>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Online</span>
        </div>
        <div style={{ flex: 1 }}/>
        <div style={{ padding: '6px 12px', background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(10px)', borderRadius: 999, border: '1px solid var(--divider)', textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--text-2)', letterSpacing: 0.5, lineHeight: 1 }}>TODAY</div>
          <div className="num" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.1 }}>$185</div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ position: 'relative', zIndex: 10, padding: '0 16px 16px' }}>
        {/* Loads counter */}
        <div style={{
          background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(14px)',
          border: '1px solid var(--divider)', borderRadius: 12, padding: 16,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, background: 'rgba(245,166,35,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.package size={20} color="var(--accent)"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}><span className="num" style={{ color: 'var(--accent)' }}>12</span> loads within 25 km</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Updated 4s ago</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--elev)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.list size={16}/>
          </div>
        </div>
      </div>

      <TabBar active="home" role="driver"/>
    </Phone>
  );
}

// 2. Load list view — alternative to map
function ScDriverLoads() {
  const loads = [
    { from: 'Avondale', to: 'Beitbridge', dist: '583 km', cargo: '140 bags cement', tons: '10t',
      price: 480, posted: '38s', bids: 4, chips: ['oversized'], hot: true },
    { from: 'Workington', to: 'Bulawayo', dist: '441 km', cargo: 'Steel rebar', tons: '20t',
      price: 720, posted: '2m', bids: 1, chips: [] },
    { from: 'CBD Harare', to: 'Mutare', dist: '263 km', cargo: 'Mixed retail', tons: '5t',
      price: 280, posted: '4m', bids: 0, chips: ['fragile'] },
    { from: 'Borrowdale', to: 'Marondera', dist: '74 km', cargo: 'Maize meal', tons: '2t',
      price: 90, posted: '7m', bids: 3, chips: [] },
    { from: 'Msasa', to: 'Chinhoyi', dist: '115 km', cargo: 'Refrigerated', tons: '5t',
      price: 220, posted: '11m', bids: 2, chips: ['refrigerated'] },
  ];
  return (
    <Phone label="17 Loads List">
      <div className="appbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Available loads</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }} className="num">12 within 25 km · sorted nearest</div>
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--card)', border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.home size={18}/>
        </div>
      </div>

      <div style={{ padding: '0 16px 8px' }}>
        <div className="pill-row">
          {['Nearest', 'Highest pay', '$/km', 'Big loads', 'Short trips'].map((p, i) => (
            <div key={p} className={'pill ' + (i === 0 ? 'on' : '')} style={{ height: 32, fontSize: 12 }}>{p}</div>
          ))}
        </div>
      </div>

      <div className="scrolly">
        <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loads.map((l, i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              {/* Header: route */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.from}</span>
                    <I.arrowRight size={12} color="var(--text-3)" stroke={2}/>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.to}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }} className="num">
                    {l.dist} · {l.cargo}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>${l.price}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>asking</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                <span className="chip amber">{l.tons}</span>
                {l.chips.includes('fragile') && <span className="chip">FRAGILE</span>}
                {l.chips.includes('refrigerated') && <span className="chip blue">REFRIGERATED</span>}
                {l.chips.includes('oversized') && <span className="chip">OVERSIZED</span>}
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, color: l.bids > 2 ? 'var(--accent)' : 'var(--text-3)' }} className="num">
                  {l.bids === 0 ? 'no bids yet' : `${l.bids} bid${l.bids > 1 ? 's' : ''}`}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>·</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }} className="num">{l.posted} ago</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TabBar active="loads" role="driver"/>
    </Phone>
  );
}

// 3. Load detail bottom sheet
function ScLoadDetail() {
  return (
    <Phone label="18 Load Detail">
      <MapBg>
        <MapPin x={80} y={140} kind="origin"/>
        <MapPin x={290} y={220} kind="dest"/>
        <RouteLine a={{x:80, y:140}} b={{x:290, y:220}}/>
      </MapBg>

      <div className="appbar" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 20, background: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(10px)', border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.chevronLeft size={20}/>
        </div>
        <div/>
        <div style={{ width: 40 }}/>
      </div>

      <div style={{ flex: 1 }}/>

      <div className="sheet" style={{ position: 'relative', maxHeight: '72%' }}>
        <div className="handle"/>

        {/* Title + price */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 17, fontWeight: 600 }}>
              Avondale <I.arrowRight size={14} color="var(--text-3)" stroke={2}/> Beitbridge
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }} className="num">
              583 km · 7h 40m · posted 38s ago
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>$480</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>shipper's price</div>
          </div>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          <span className="chip amber">10 tonnes</span>
          <span className="chip">OVERSIZED</span>
          <span className="chip">CEMENT BAGS</span>
        </div>

        {/* Stats grid */}
        <div style={{ marginTop: 18, padding: 14, background: 'var(--elev)', borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.5 }}>TO PICKUP</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>2.4 km</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }} className="num">6 min</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.5 }}>$ / km</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>$0.82</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>route avg</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', letterSpacing: 0.5 }}>BIDS</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: 'var(--accent)' }}>4 placed</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>be quick</div>
          </div>
        </div>

        {/* Shipper trust card */}
        <div style={{ marginTop: 12, padding: 14, background: 'var(--card)', border: '1px solid var(--divider)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <I.shieldCheck size={22} color="var(--green)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Verified shipper · 47 jobs posted</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Stars rating={4.8} size={10}/>
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>aggregate driver rating</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button className="btn-dark" style={{ flex: 1 }}><I.navigation size={16}/> Directions</button>
          <button className="btn-primary" style={{ flex: 1 }}>Place bid</button>
        </div>
      </div>
    </Phone>
  );
}

// 4. Place bid screen — driver's pricing terminal
function ScPlaceBid() {
  return (
    <Phone label="19 Place Bid">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Place bid</div>
        <div style={{ width: 22 }}/>
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <I.package size={18} color="var(--accent)"/>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
            <span style={{ color: '#fff', fontWeight: 500 }}>Avondale → Beitbridge</span> · 10t cement
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }} className="num">$480</div>
        </div>
      </div>

      {/* Big bid input */}
      <div style={{ padding: '32px 20px 0', textAlign: 'center' }}>
        <div className="input-label" style={{ marginBottom: 10 }}>YOUR BID</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
          <span style={{ color: 'var(--text-2)', fontSize: 28, fontWeight: 400 }}>$</span>
          <span className="num" style={{ fontSize: 72, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>465</span>
          <span style={{ display: 'inline-block', width: 3, height: 64, background: 'var(--accent)', marginLeft: 2 }}/>
        </div>
        <div style={{ marginTop: 10, color: 'var(--text-2)', fontSize: 12 }}>
          <span style={{ color: 'var(--green)' }} className="num">−$15</span> vs. asking · <span className="num">$0.80/km</span>
        </div>
      </div>

      {/* Earnings reference — driver-side differentiator */}
      <div style={{ padding: '32px 20px 0' }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="eyebrow">YOUR LAST 5 ON THIS ROUTE</div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-end', gap: 10, height: 64 }}>
            {[
              { v: 458, h: 36 },
              { v: 472, h: 48 },
              { v: 465, h: 42 },
              { v: 485, h: 60 },
              { v: 470, h: 48 },
            ].map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div className="num" style={{ fontSize: 11, color: 'var(--text-2)' }}>${b.v}</div>
                <div style={{ width: '100%', height: b.h, background: 'var(--accent)', borderRadius: 2, opacity: 0.7 + i*0.06 }}/>
              </div>
            ))}
          </div>
          <div className="hr" style={{ margin: '14px -8px 12px' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--text-2)' }}>Your average · this route</span>
            <span className="num" style={{ fontWeight: 700, color: '#fff' }}>$470</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Active bids</span>
          <span className="num">2 of 3</span>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary">Submit bid · $465</button>
      </div>
    </Phone>
  );
}

// 5. Driver match confirmed (different from shipper's — focuses on action)
function ScDriverMatch() {
  return (
    <Phone label="20 Driver Match">
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(245,166,35,0.15), rgba(0,0,0,0))', pointerEvents: 'none' }}/>

      <div className="appbar">
        <div/><div/><div/>
      </div>

      <div style={{ padding: '40px 20px 0' }}>
        <div className="eyebrow" style={{ color: 'var(--accent)' }}>YOU GOT THIS LOAD</div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.7, marginTop: 6, lineHeight: 1.05 }}>
          Pickup in<br/>
          <span className="num" style={{ color: 'var(--accent)' }}>14 min</span>
        </div>
      </div>

      <div style={{ padding: '32px 20px 0' }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="eyebrow">JOB</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 600, marginTop: 6 }}>
            Avondale <I.arrowRight size={14} color="var(--text-3)" stroke={2}/> Beitbridge
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }} className="num">10t cement · 583 km</div>

          <div className="hr" style={{ margin: '14px -8px' }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name="Brian S" size={40}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Brian S. <span style={{ color: 'var(--text-3)' }}>· shipper</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>47 jobs · <Stars rating={4.8} size={10}/></div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--elev)', border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.message size={16}/>
            </div>
          </div>

          <div className="hr" style={{ margin: '14px -8px' }}/>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div className="eyebrow">YOU EARN</div>
              <div className="num" style={{ fontSize: 28, fontWeight: 700, color: 'var(--green)', marginTop: 4, lineHeight: 1 }}>$465</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="eyebrow">PAYMENT</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4 }}>Direct with shipper</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>On delivery</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary"><I.navigation size={18}/> Start navigation</button>
      </div>
    </Phone>
  );
}

// 6. En route to pickup — navigation overlay
function ScEnRoute() {
  return (
    <Phone label="21 En route">
      <MapBg>
        <RouteLine a={{x: 60, y: 600}} b={{x: 280, y: 200}} dashed/>
        <MapPin x={60} y={600} kind="driver"/>
        <MapPin x={280} y={200} kind="origin"/>
      </MapBg>

      {/* turn-by-turn banner */}
      <div style={{ margin: '8px 16px 0', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: 'var(--accent)', color: '#0A0A0A',
          borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <I.arrowUp size={32} stroke={2.4} color="#0A0A0A" style={{ transform: 'rotate(45deg)' }}/>
          <div style={{ flex: 1 }}>
            <div className="num" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}>1.2 km</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, lineHeight: 1.2 }}>Turn right onto Borrowdale Rd</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{ position: 'relative', zIndex: 10, padding: '0 16px 16px' }}>
        <div style={{
          background: 'rgba(20,20,20,0.92)', backdropFilter: 'blur(14px)',
          border: '1px solid var(--divider)', borderRadius: 12, padding: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div className="eyebrow">DESTINATION</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>Avondale Shops, Harare</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Pickup point</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>9 min</div>
              <div className="num" style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>3.1 km · 10:31 arr</div>
            </div>
          </div>

          <div style={{ height: 12 }}/>
          <button className="btn-primary">I've arrived at pickup</button>
        </div>
      </div>
    </Phone>
  );
}

// 7. Confirm cargo loaded — POD capture by driver
function ScCargoLoaded() {
  return (
    <Phone label="22 Cargo loaded">
      <div className="appbar">
        <button style={{ background: 'transparent', border: 0, color: '#fff', padding: 0 }}>
          <I.chevronLeft size={22}/>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Confirm pickup</div>
        <div style={{ width: 22 }}/>
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
          Photo goes straight to the shipper. Required before you can start delivery.
        </div>
      </div>

      {/* Camera view (placeholder framing) */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--divider)' }}>
          <ImgBox w="100%" h={300} label="camera · point at loaded cargo" radius={12}/>
          {/* corner brackets */}
          <div style={{ position: 'absolute', inset: 14, pointerEvents: 'none' }}>
            {['top left', 'top right', 'bottom left', 'bottom right'].map((p, i) => {
              const [v, h] = p.split(' ');
              return (
                <div key={i} style={{
                  position: 'absolute', [v]: 0, [h]: 0, width: 22, height: 22,
                  borderTop: v === 'top' ? '2px solid var(--accent)' : 'none',
                  borderBottom: v === 'bottom' ? '2px solid var(--accent)' : 'none',
                  borderLeft: h === 'left' ? '2px solid var(--accent)' : 'none',
                  borderRight: h === 'right' ? '2px solid var(--accent)' : 'none',
                }}/>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px 0' }}>
        <div className="input-group">
          <div className="input-label">DISCREPANCY (OPTIONAL)</div>
          <div className="input" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)' }}>
            <span>e.g. 130 bags loaded (listed 140)</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.check size={12} color="#0A0A0A" stroke={3}/>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>GPS + timestamp will be attached automatically</span>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '16px 20px 32px' }}>
        <button className="btn-primary"><I.camera size={18}/> Capture & start delivery</button>
      </div>
    </Phone>
  );
}

// 8. Job complete / driver earnings summary
function ScJobComplete() {
  return (
    <Phone label="23 Job complete">
      <div className="appbar">
        <div style={{ width: 22 }}/>
        <div/>
        <div style={{ width: 22 }}/>
      </div>

      <div style={{ padding: '40px 20px 0', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 36, background: 'rgba(0,200,83,0.12)',
          border: '1px solid rgba(0,200,83,0.3)', margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <I.check size={36} color="var(--green)" stroke={2.5}/>
        </div>
        <div style={{ marginTop: 18, color: 'var(--text-2)', fontSize: 13, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Delivered · 7h 31m
        </div>
        <div className="num" style={{ marginTop: 8, fontSize: 56, fontWeight: 700, letterSpacing: -2, lineHeight: 1, color: 'var(--accent)' }}>
          +$465
        </div>
        <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 8 }}>
          received direct from shipper · job <span className="num" style={{ color: '#fff' }}>L-49118</span>
        </div>
      </div>

      <div style={{ padding: '32px 20px 0' }}>
        <div className="card" style={{ padding: 0 }}>
          {[
            ['Route', 'Avondale → Beitbridge'],
            ['Distance', '583 km'],
            ['Fuel est.', '$94'],
            ['Tolls', '$24'],
            ['Net', '$347'],
          ].map(([k, v], i, arr) => (
            <div key={i} style={{
              padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
              borderBottom: i < arr.length - 1 ? '1px solid var(--divider)' : 'none',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--text-2)' }}>{k}</span>
              <span style={{ color: k === 'Net' ? 'var(--green)' : '#fff', fontWeight: k === 'Net' ? 700 : 500 }} className="num">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* day total chip */}
      <div style={{ padding: '16px 20px 0' }}>
        <div className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: 0.5 }}>TODAY'S TOTAL</div>
            <div className="num" style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>$650</div>
          </div>
          <I.trendingUp size={20} color="var(--accent)"/>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <div style={{ padding: '0 20px 32px' }}>
        <button className="btn-primary">Rate Brian</button>
        <div style={{ height: 8 }}/>
        <button className="btn-dark">Back to loads</button>
      </div>
    </Phone>
  );
}

// 9. Driver earnings dashboard
function ScEarnings() {
  const days = [
    { d: 'Mon', v: 38 }, { d: 'Tue', v: 52 }, { d: 'Wed', v: 78 },
    { d: 'Thu', v: 41 }, { d: 'Fri', v: 95 }, { d: 'Sat', v: 110 }, { d: 'Sun', v: 0 },
  ];
  const max = 110;
  return (
    <Phone label="24 Earnings">
      <div className="appbar">
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.3 }}>Earnings</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>This week · Mon 13 May – Sun 19 May</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--card)', border: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I.calendar size={16}/>
        </div>
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <div className="num" style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1.8, lineHeight: 1 }}>$1,840</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
            <I.trendingUp size={14} color="var(--green)"/> +18%
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>vs. last week</span>
        </div>
      </div>

      {/* bar chart */}
      <div style={{ padding: '28px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
          {days.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: '100%', height: Math.max(2, (d.v / max) * 100),
                background: d.v === 0 ? 'var(--divider)' : (i === 5 ? 'var(--accent)' : 'var(--text-3)'),
                borderRadius: 2,
              }}/>
              <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{d.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* breakdown */}
      <div style={{ padding: '24px 16px 0' }}>
        <div className="card" style={{ padding: 0 }}>
          {[
            ['Jobs completed', '7'],
            ['Distance', '2,415 km'],
            ['Average per job', '$262'],
            ['Best day', 'Sat · $440'],
          ].map(([k, v], i, arr) => (
            <div key={i} style={{
              padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
              borderBottom: i < arr.length - 1 ? '1px solid var(--divider)' : 'none',
              fontSize: 13,
            }}>
              <span style={{ color: 'var(--text-2)' }}>{k}</span>
              <span style={{ color: '#fff', fontWeight: 500 }} className="num">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* subscription transparency */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <I.shieldCheck size={20} color="var(--accent)"/>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--text-2)' }}>
            Earned <span className="num" style={{ color: '#fff', fontWeight: 600 }}>$1,840</span> · paid direct by shippers · subscription <span className="num" style={{ color: '#fff', fontWeight: 600 }}>$7</span> this week
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}/>
      <TabBar active="earn" role="driver"/>
    </Phone>
  );
}

Object.assign(window, {
  ScDriverHome, ScDriverLoads, ScLoadDetail, ScPlaceBid, ScDriverMatch,
  ScEnRoute, ScCargoLoaded, ScJobComplete, ScEarnings,
});
