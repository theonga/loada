// Print layout — one phone per page, grouped by flow.

const PRINT_SECTIONS = [
  {
    title: 'Onboarding & auth',
    subtitle: 'Phone + OTP, role select, driver docs, subscription paywall',
    screens: [
      { label: '01 · Splash',                   comp: ScSplash },
      { label: '02 · Role select',              comp: ScRoleSelect },
      { label: '03 · OTP verification',         comp: ScOTP },
      { label: '04 · Driver documents',         comp: ScDriverDocs },
      { label: '05 · Driver subscription',      comp: ScPaywall },
    ],
  },
  {
    title: 'Shipper flow',
    subtitle: 'Post a load → bids → match → track → POD → rate',
    screens: [
      { label: '06 · Map home',                 comp: ScShipperHome },
      { label: '07 · Post · route',             comp: ScPostRoute },
      { label: '08 · Post · cargo',             comp: ScPostCargo },
      { label: '09 · Post · price (★ market reference)', comp: ScPostPricing },
      { label: '10 · Waiting for bids',         comp: ScEmptyBids },
      { label: '11 · Bid inbox · A (cards)',    comp: ScBidInboxA },
      { label: '11 · Bid inbox · B (terminal)', comp: ScBidInboxB },
      { label: '12 · Counter-offer',            comp: ScCounter },
      { label: '13 · Match confirmed',          comp: ScMatchConfirmed },
      { label: '14 · Active job · tracking',    comp: ScShipperTracking },
      { label: '15 · Proof of delivery (★)',    comp: ScPOD },
      { label: '16 · Rate driver',              comp: ScRateDriver },
    ],
  },
  {
    title: 'Driver flow',
    subtitle: 'Map → loads → bid → match → navigate → POD capture → earnings',
    screens: [
      { label: '17 · Map home',                 comp: ScDriverHome },
      { label: '18 · Load list',                comp: ScDriverLoads },
      { label: '19 · Load detail',              comp: ScLoadDetail },
      { label: '20 · Place bid (★ benchmark)',  comp: ScPlaceBid },
      { label: '21 · Match confirmed',          comp: ScDriverMatch },
      { label: '22 · En route to pickup',       comp: ScEnRoute },
      { label: '23 · Cargo loaded',             comp: ScCargoLoaded },
      { label: '24 · Job complete',             comp: ScJobComplete },
      { label: '25 · Earnings (★ transparency)',comp: ScEarnings },
    ],
  },
  {
    title: 'Shared & supporting',
    subtitle: 'Chat, notifications, profile, help — across both roles',
    screens: [
      { label: '26 · In-app chat',              comp: ScChat },
      { label: '27 · Notifications',            comp: ScNotifications },
      { label: '28 · Driver profile',           comp: ScDriverProfile },
      { label: '29 · Help · WhatsApp-first',    comp: ScHelp },
    ],
  },
];

function PrintCoverPage() {
  return (
    <div className="print-page print-cover">
      <div className="print-cover-mark">
        <Wordmark size={64}/>
      </div>
      <div className="print-cover-tag">Move more. Wait less.</div>
      <div className="print-cover-meta">
        <div className="print-cover-meta-row"><span>Document</span><span>Mobile design system</span></div>
        <div className="print-cover-meta-row"><span>Market</span><span>Zimbabwe · USD</span></div>
        <div className="print-cover-meta-row"><span>Platform</span><span>Mobile · 375 × 812 · dark</span></div>
        <div className="print-cover-meta-row"><span>Screens</span><span>30 · 4 flows</span></div>
        <div className="print-cover-meta-row"><span>Revision</span><span>v1.0 · May 2026</span></div>
      </div>
    </div>
  );
}

function PrintSectionDivider({ section, index, count }) {
  return (
    <div className="print-page print-divider">
      <div className="print-divider-eyebrow">FLOW {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}</div>
      <div className="print-divider-title">{section.title}</div>
      <div className="print-divider-sub">{section.subtitle}</div>
      <div className="print-divider-screens">
        {section.screens.map(s => (
          <div key={s.label} className="print-divider-screen">{s.label}</div>
        ))}
      </div>
    </div>
  );
}

function PrintScreenPage({ screen, sectionTitle }) {
  const Comp = screen.comp;
  return (
    <div className="print-page print-screen">
      <div className="print-screen-head">
        <span className="print-screen-section">{sectionTitle}</span>
        <span className="print-screen-label">{screen.label}</span>
      </div>
      <div className="print-screen-stage">
        <div className="print-phone-shell">
          <Comp/>
        </div>
      </div>
      <div className="print-screen-foot">
        <Wordmark size={14}/>
        <span>Mobile design system · v1.0</span>
      </div>
    </div>
  );
}

function PrintApp() {
  return (
    <>
      <PrintCoverPage/>
      {PRINT_SECTIONS.map((s, i) => (
        <React.Fragment key={s.title}>
          <PrintSectionDivider section={s} index={i} count={PRINT_SECTIONS.length}/>
          {s.screens.map(scr => (
            <PrintScreenPage key={scr.label} screen={scr} sectionTitle={s.title}/>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PrintApp/>);

// Auto-print after fonts + render settle
(async () => {
  try { await document.fonts.ready; } catch (e) {}
  await new Promise(r => setTimeout(r, 600));
  window.print();
})();
