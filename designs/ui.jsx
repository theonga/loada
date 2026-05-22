// Loada — shared UI primitives
// Phone frame, status bar, icons, map background, pins, avatars, common bits.

// ─────────────────────────── ICONS ──────────────────────────
// Lucide-style outline, 24px, currentColor, stroke 1.75
const I = {};
const mkIcon = (name, paths) => {
  I[name] = ({ size = 20, stroke = 1.75, color = 'currentColor', style }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
         style={style}>{paths}</svg>
  );
};

mkIcon('truck', <>
  <path d="M10 17h4V5H1v12h2"/><path d="M14 8h5l3 4v5h-2"/><path d="M14 17h2"/>
  <circle cx="5.5" cy="17" r="2.5"/><circle cx="17.5" cy="17" r="2.5"/>
</>);
mkIcon('package', <>
  <path d="M16.5 9.4 7.55 4.24"/>
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
  <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
</>);
mkIcon('mapPin', <>
  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
</>);
mkIcon('chevronRight', <path d="m9 18 6-6-6-6"/>);
mkIcon('chevronLeft', <path d="m15 18-6-6 6-6"/>);
mkIcon('chevronDown', <path d="m6 9 6 6 6-6"/>);
mkIcon('arrowRight', <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>);
mkIcon('arrowUp', <><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></>);
mkIcon('plus', <><path d="M12 5v14"/><path d="M5 12h14"/></>);
mkIcon('x', <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>);
mkIcon('check', <path d="M20 6 9 17l-5-5"/>);
mkIcon('bell', <>
  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
</>);
mkIcon('star', <path d="M11.5 2.7 13.9 8l5.8.6-4.3 4 1.2 5.7-5.1-3-5.1 3 1.2-5.7-4.3-4 5.8-.6L11.5 2.7Z" fill="currentColor"/>);
mkIcon('starOutline', <path d="M11.5 2.7 13.9 8l5.8.6-4.3 4 1.2 5.7-5.1-3-5.1 3 1.2-5.7-4.3-4 5.8-.6L11.5 2.7Z"/>);
mkIcon('phone', <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>);
mkIcon('message', <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>);
mkIcon('navigation', <polygon points="3 11 22 2 13 21 11 13 3 11"/>);
mkIcon('settings', <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></>);
mkIcon('home', <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><polyline points="9 22 9 12 15 12 15 22"/></>);
mkIcon('list', <><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></>);
mkIcon('user', <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>);
mkIcon('wallet', <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></>);
mkIcon('camera', <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></>);
mkIcon('upload', <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></>);
mkIcon('download', <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>);
mkIcon('file', <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>);
mkIcon('clock', <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>);
mkIcon('calendar', <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>);
mkIcon('mic', <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>);
mkIcon('search', <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>);
mkIcon('shield', <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>);
mkIcon('alertTriangle', <><path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></>);
mkIcon('power', <><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" x2="12" y1="2" y2="12"/></>);
mkIcon('zap', <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>);
mkIcon('snowflake', <><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></>);
mkIcon('shieldAlert', <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></>);
mkIcon('move', <><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></>);
mkIcon('users', <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>);
mkIcon('trendingUp', <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>);
mkIcon('signature', <path d="M3 17s4-1 6-3 3-5 3-7-1-3-2-3-3 1-3 5 2 8 4 9 4-1 5-2 1-3 2-3 2 3 4 3"/>);
mkIcon('helpCircle', <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></>);
mkIcon('bookOpen', <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/></>);
mkIcon('refresh', <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>);
mkIcon('shieldCheck', <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>);
mkIcon('volume', <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>);
mkIcon('share', <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></>);

// ─────────────────────────── PHONE FRAME ──────────────────────
function Statusbar({ light = true, time = '9:41' }) {
  const c = light ? '#fff' : '#000';
  return (
    <div className="statusbar" style={{ color: c }}>
      <span className="dot-time">{time}</span>
      <div className="icons">
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.6" fill={c}/><rect x="4.5" y="5" width="3" height="6" rx="0.6" fill={c}/><rect x="9" y="2.5" width="3" height="8.5" rx="0.6" fill={c}/><rect x="13.5" y="0" width="3" height="11" rx="0.6" fill={c}/></svg>
        {/* wifi */}
        <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 3a8 8 0 0 1 5.7 2.3l1.2-1.2A10 10 0 0 0 8 1a10 10 0 0 0-6.9 3.1l1.2 1.2A8 8 0 0 1 8 3Z" fill={c}/><path d="M8 6.5a4 4 0 0 1 2.8 1.2l1.2-1.2A6 6 0 0 0 8 4.5a6 6 0 0 0-4 2l1.2 1.2A4 4 0 0 1 8 6.5Z" fill={c}/><circle cx="8" cy="9.5" r="1.5" fill={c}/></svg>
        {/* battery */}
        <svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke={c} strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="19" height="8" rx="1.5" fill={c}/><path d="M24 4v4c.7-.2 1.2-1 1.2-2s-.5-1.8-1.2-2Z" fill={c} fillOpacity="0.5"/></svg>
      </div>
    </div>
  );
}

function Phone({ children, sb = true, hi = true, label }) {
  return (
    <div className="phone" data-screen-label={label}>
      {sb && <Statusbar/>}
      {children}
      {hi && <div className="home-ind"/>}
    </div>
  );
}

// ─────────────────────────── MAP BACKGROUND ──────────────────
// Stylized dark map. Roads as SVG paths, district blocks as low-opacity rects.
// Renders fixed in the phone bounds; pins are positioned by parent.
function MapBg({ children, variant = 'a' }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#0E0F11',
      overflow: 'hidden',
    }}>
      <svg viewBox="0 0 375 812" preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id={`gridP-${variant}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="#15171A" strokeWidth="1"/>
          </pattern>
        </defs>

        <rect width="375" height="812" fill={`url(#gridP-${variant})`} />

        {/* District blocks — irregular dark patches */}
        <g opacity="0.55" fill="#161819">
          <path d="M-20 80 L120 30 L180 110 L130 230 L0 200 Z"/>
          <path d="M180 110 L300 50 L390 130 L350 260 L240 240 Z"/>
          <path d="M40 280 L210 270 L260 380 L120 440 L20 380 Z"/>
          <path d="M260 280 L390 290 L390 460 L280 470 L240 360 Z"/>
          <path d="M30 480 L180 470 L240 600 L110 660 L-10 580 Z"/>
          <path d="M240 480 L380 490 L390 660 L260 680 L210 580 Z"/>
        </g>
        {/* Park / green-space patches */}
        <g opacity="0.18" fill="#1B3320">
          <path d="M70 320 L150 310 L170 380 L100 400 Z"/>
          <path d="M280 510 L350 520 L340 590 L270 600 Z"/>
        </g>
        {/* Water — river curve */}
        <path d="M-10 700 Q 120 660 220 720 T 400 700 L 400 820 L -10 820 Z" fill="#0B1A26" opacity="0.7"/>

        {/* Primary motorway — diagonal */}
        <path d="M-30 720 L 420 -30" stroke="#23262B" strokeWidth="6"/>
        <path d="M-30 720 L 420 -30" stroke="#2C2F35" strokeWidth="1" strokeDasharray="6 8"/>

        {/* Cross motorway */}
        <path d="M-30 200 L 420 540" stroke="#23262B" strokeWidth="5"/>

        {/* Secondary streets */}
        <g stroke="#1C1E22" strokeWidth="2" fill="none">
          <path d="M-10 100 L 410 280"/>
          <path d="M40 400 L 380 560"/>
          <path d="M-10 540 L 380 720"/>
          <path d="M-10 380 L 420 240"/>
          <path d="M120 -10 L 50 820"/>
          <path d="M210 -10 L 250 820"/>
          <path d="M320 -10 L 290 820"/>
        </g>
        {/* Tertiary streets */}
        <g stroke="#181A1D" strokeWidth="1" fill="none">
          <path d="M-10 60 L 410 180"/>
          <path d="M-10 300 L 410 380"/>
          <path d="M-10 460 L 410 470"/>
          <path d="M-10 620 L 410 600"/>
          <path d="M60 -10 L 100 820"/>
          <path d="M160 -10 L 180 820"/>
          <path d="M260 -10 L 220 820"/>
          <path d="M360 -10 L 340 820"/>
        </g>
        {/* Place labels — minimal */}
        <g fill="#3A3D42" fontFamily="Inter" fontSize="9" fontWeight="500" letterSpacing="1">
          <text x="60" y="200">AVONDALE</text>
          <text x="220" y="170">BORROWDALE</text>
          <text x="80" y="360">CBD</text>
          <text x="240" y="420">EASTLEA</text>
          <text x="40" y="560">WORKINGTON</text>
          <text x="240" y="590">MSASA</text>
        </g>
      </svg>
      {children}
    </div>
  );
}

// Pin on map — accent diamond, dot circle, etc.
function MapPin({ x, y, kind = 'load', label, scale = 1, active = false }) {
  const style = { position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)' };
  if (kind === 'driver') {
    return (
      <div style={style}>
        <div style={{
          width: 32 * scale, height: 32 * scale, borderRadius: '50%',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #0A0A0A',
          boxShadow: '0 0 0 6px rgba(245,166,35,0.18)',
        }}>
          <I.truck size={16 * scale} stroke={2} color="#0A0A0A"/>
        </div>
      </div>
    );
  }
  if (kind === 'me') {
    return (
      <div style={style}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--blue)', border: '3px solid #fff',
          boxShadow: '0 0 0 8px rgba(33,150,243,0.15)',
        }}/>
      </div>
    );
  }
  if (kind === 'origin' || kind === 'dest') {
    return (
      <div style={style}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: kind === 'origin' ? '#fff' : 'var(--accent)',
          border: kind === 'origin' ? '3px solid #0A0A0A' : '3px solid #0A0A0A',
          boxShadow: '0 0 0 1.5px ' + (kind === 'origin' ? '#fff' : 'var(--accent)'),
        }}/>
      </div>
    );
  }
  // load — diamond outline (or filled if active)
  const sz = (active ? 22 : 16) * scale;
  return (
    <div style={style}>
      <div style={{
        width: sz, height: sz, transform: 'rotate(45deg)',
        background: active ? 'var(--accent)' : 'transparent',
        border: '2px solid ' + (active ? 'var(--accent)' : '#fff'),
      }}/>
      {label && (
        <div style={{
          position: 'absolute', top: sz + 8, left: '50%', transform: 'translateX(-50%)',
          background: '#0A0A0A', color: active ? 'var(--accent)' : '#fff',
          fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 3,
          border: '1px solid var(--divider)', whiteSpace: 'nowrap',
        }}>{label}</div>
      )}
    </div>
  );
}

// Route polyline on map (start + end x/y in 0..375 and 0..812)
function RouteLine({ a, b, dashed = false }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
         viewBox="0 0 375 812" preserveAspectRatio="none">
      <path d={`M${a.x} ${a.y} Q ${(a.x+b.x)/2} ${Math.min(a.y,b.y)-40}, ${b.x} ${b.y}`}
        fill="none" stroke="#F5A623" strokeWidth="3"
        strokeDasharray={dashed ? '6 6' : 'none'} strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────── AVATAR ──────────────────────────
function Avatar({ name = 'TM', size = 40, color, src }) {
  const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  // deterministic muted color
  const hues = ['#7A4E2E', '#3D5A6C', '#5A4A2A', '#3F5A3F', '#5C3A4E', '#3A4E5C', '#664A2A'];
  const bg = color || hues[(name.charCodeAt(0) || 0) % hues.length];
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: bg }}>
      {initials}
    </div>
  );
}

// Star rating — outline + filled, e.g. 4.8
function Stars({ rating = 4.8, count, size = 12 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-2)' }}>
      <I.star size={size} color="#F5A623"/>
      <span className="num" style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{rating}</span>
      {count != null && <span className="num" style={{ fontSize: 12, color: 'var(--text-2)' }}>({count})</span>}
    </span>
  );
}

// Loada wordmark
function Wordmark({ size = 32, color = '#fff', accent = 'var(--accent)' }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', position: 'relative' }}>
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontWeight: 800,
        fontSize: size,
        letterSpacing: -1.2,
        color,
        lineHeight: 1,
      }}>Loada</span>
      <span style={{
        position: 'absolute', left: 0, right: size * 0.22, bottom: -4,
        height: size * 0.08, background: accent, borderRadius: 1,
      }}/>
    </div>
  );
}

// Bottom tabbar — used in main screens (after onboarding)
function TabBar({ active = 'home', role = 'shipper' }) {
  const shipper = [
    { id: 'home',    label: 'Map',      icon: I.home },
    { id: 'jobs',    label: 'Jobs',     icon: I.list },
    { id: 'inbox',   label: 'Messages', icon: I.message },
    { id: 'profile', label: 'Profile',  icon: I.user },
  ];
  const driver = [
    { id: 'home',    label: 'Map',      icon: I.home },
    { id: 'loads',   label: 'Loads',    icon: I.list },
    { id: 'earn',    label: 'Earnings', icon: I.trendingUp },
    { id: 'inbox',   label: 'Messages', icon: I.message },
    { id: 'profile', label: 'Profile',  icon: I.user },
  ];
  const tabs = role === 'driver' ? driver : shipper;
  return (
    <div className="tabbar">
      {tabs.map(t => {
        const Ic = t.icon;
        const on = t.id === active;
        return (
          <div key={t.id} className={'tab ' + (on ? 'on' : '')}>
            <Ic size={22} stroke={on ? 2 : 1.6} color={on ? 'var(--accent)' : 'var(--text-3)'}/>
            <span>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Image placeholder with monospace label
function ImgBox({ w, h, label = 'image', radius = 8, style }) {
  return (
    <div className="imgbox" style={{ width: w, height: h, borderRadius: radius, ...style }}>
      {label}
    </div>
  );
}

Object.assign(window, { I, Phone, Statusbar, MapBg, MapPin, RouteLine, Avatar, Stars, Wordmark, TabBar, ImgBox });
