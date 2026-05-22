// Loada — App composition: design canvas of all screens, grouped by flow.

const LOADA_TWEAKS = /*EDITMODE-BEGIN*/{
  "accent": "#F5A623",
  "showFrames": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(LOADA_TWEAKS);

  // Live-apply accent override
  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent', t.accent);
  }, [t.accent]);

  return (
    <>
      <DesignCanvas minScale={0.15} maxScale={2.5}>
        <DCSection id="onboarding" title="Onboarding & auth"
          subtitle="Splash → role → OTP → docs → driver paywall. Drivers active in under 5 minutes.">
          <DCArtboard id="splash"   label="01 · Splash"     width={375} height={812}><ScSplash/></DCArtboard>
          <DCArtboard id="role"     label="02 · Role"       width={375} height={812}><ScRoleSelect/></DCArtboard>
          <DCArtboard id="otp"      label="03 · OTP"        width={375} height={812}><ScOTP/></DCArtboard>
          <DCArtboard id="docs"     label="04 · Documents"  width={375} height={812}><ScDriverDocs/></DCArtboard>
          <DCArtboard id="paywall"  label="05 · Paywall"    width={375} height={812}><ScPaywall/></DCArtboard>
        </DCSection>

        <DCSection id="shipper" title="Shipper flow"
          subtitle="Post a load → bids → match → track → POD → rate. The Pricing and Bid Inbox screens are where Loada beats InDrive.">
          <DCArtboard id="s-home"   label="06 · Map home"      width={375} height={812}><ScShipperHome/></DCArtboard>
          <DCArtboard id="s-route"  label="07 · Post · route"  width={375} height={812}><ScPostRoute/></DCArtboard>
          <DCArtboard id="s-cargo"  label="08 · Post · cargo"  width={375} height={812}><ScPostCargo/></DCArtboard>
          <DCArtboard id="s-price"  label="09 · Post · price ★" width={375} height={812}><ScPostPricing/></DCArtboard>
          <DCArtboard id="s-empty"  label="10 · Waiting for bids" width={375} height={812}><ScEmptyBids/></DCArtboard>
          <DCArtboard id="s-bidsA"  label="11 · Bid inbox · A"  width={375} height={812}><ScBidInboxA/></DCArtboard>
          <DCArtboard id="s-bidsB"  label="11 · Bid inbox · B (terminal)" width={375} height={812}><ScBidInboxB/></DCArtboard>
          <DCArtboard id="s-count"  label="12 · Counter-offer"   width={375} height={812}><ScCounter/></DCArtboard>
          <DCArtboard id="s-match"  label="13 · Match confirmed" width={375} height={812}><ScMatchConfirmed/></DCArtboard>
          <DCArtboard id="s-track"  label="14 · Tracking"        width={375} height={812}><ScShipperTracking/></DCArtboard>
          <DCArtboard id="s-pod"    label="15 · POD ★"           width={375} height={812}><ScPOD/></DCArtboard>
          <DCArtboard id="s-rate"   label="16 · Rate driver"     width={375} height={812}><ScRateDriver/></DCArtboard>
        </DCSection>

        <DCSection id="driver" title="Driver flow"
          subtitle="Map → loads → bid → match → navigate → POD capture → earnings. Earnings transparency is the key differentiator vs commission-based competitors.">
          <DCArtboard id="d-home"   label="17 · Map home"      width={375} height={812}><ScDriverHome/></DCArtboard>
          <DCArtboard id="d-list"   label="18 · Load list"     width={375} height={812}><ScDriverLoads/></DCArtboard>
          <DCArtboard id="d-detail" label="19 · Load detail"   width={375} height={812}><ScLoadDetail/></DCArtboard>
          <DCArtboard id="d-bid"    label="20 · Place bid ★"   width={375} height={812}><ScPlaceBid/></DCArtboard>
          <DCArtboard id="d-match"  label="21 · Match"         width={375} height={812}><ScDriverMatch/></DCArtboard>
          <DCArtboard id="d-route"  label="22 · En route"      width={375} height={812}><ScEnRoute/></DCArtboard>
          <DCArtboard id="d-cargo"  label="23 · Cargo loaded"  width={375} height={812}><ScCargoLoaded/></DCArtboard>
          <DCArtboard id="d-done"   label="24 · Job complete"  width={375} height={812}><ScJobComplete/></DCArtboard>
          <DCArtboard id="d-earn"   label="25 · Earnings ★"    width={375} height={812}><ScEarnings/></DCArtboard>
        </DCSection>

        <DCSection id="shared" title="Shared & supporting"
          subtitle="Chat (job-scoped, masked numbers), notifications, profile, help (WhatsApp-first).">
          <DCArtboard id="sh-chat"   label="26 · In-app chat"     width={375} height={812}><ScChat/></DCArtboard>
          <DCArtboard id="sh-notif"  label="27 · Notifications"   width={375} height={812}><ScNotifications/></DCArtboard>
          <DCArtboard id="sh-prof"   label="28 · Driver profile"  width={375} height={812}><ScDriverProfile/></DCArtboard>
          <DCArtboard id="sh-help"   label="29 · Help · WhatsApp" width={375} height={812}><ScHelp/></DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Brand"/>
        <TweakColor label="Accent" value={t.accent}
          options={['#F5A623', '#00C853', '#2196F3', '#FF4D4D', '#A78BFA']}
          onChange={(v) => setTweak('accent', v)}/>
        <TweakSection label="About"/>
        <div style={{ padding: '8px 12px', fontSize: 11, color: '#7c7567', lineHeight: 1.5 }}>
          Drag artboards to reorder. Click any to enter focus mode with ←/→ between screens and ↑/↓ between flows. Click labels to rename.
        </div>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
