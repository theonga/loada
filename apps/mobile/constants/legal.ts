export const LEGAL_EFFECTIVE_DATE = '28 May 2026';
export const LEGAL_COMPANY = 'Loada Technologies (Private) Limited';
export const LEGAL_EMAIL = 'legal@loada.app';
export const LEGAL_SECURITY_EMAIL = 'security@loada.app';
export const LEGAL_SUPPORT_EMAIL = 'support@loada.app';

export interface LegalSection {
  heading: string;
  body: string;
  /** Defined only when a section applies to one role only */
  role?: 'shipper' | 'driver';
}

// ---------------------------------------------------------------------------
// TERMS OF USE
// ---------------------------------------------------------------------------
export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: 'Introduction & Acceptance',
    body: `By creating a Loada account you agree to these Terms of Use ("Terms"). If you do not agree, do not use the app.

These Terms form a binding contract between you and Loada Technologies (Private) Limited ("Loada", "we", "us"), a company registered in Zimbabwe.`,
  },
  {
    heading: 'Eligibility',
    body: `You must be at least 18 years old to use Loada. By creating an account you confirm that you are 18 or older and legally capable of entering into contracts under the laws of the Republic of Zimbabwe or the country in which you reside.`,
  },
  {
    heading: 'Your Account',
    body: `You are responsible for keeping your account secure. Do not share your one-time code (OTP) with anyone. Loada will never ask for your OTP via phone call, chat, or email.

Notify us immediately at ${LEGAL_SUPPORT_EMAIL} if you suspect unauthorised access to your account. You are responsible for all activity that occurs under your account.`,
  },
  {
    heading: 'The Loada Marketplace',
    body: `Loada operates a two-sided marketplace connecting shippers (who post loads) with drivers (who bid on loads). Loada is not a party to any freight contract formed through the platform. All freight agreements are solely between the shipper and the driver.

Loada does not inspect cargo, vet the quality of drivers or shippers beyond document verification, or guarantee that any job will be completed to a particular standard.`,
  },
  {
    heading: 'Shipper Responsibilities',
    role: 'shipper',
    body: `As a shipper you agree to:

• Post only loads you have the legal authority to transport.
• Describe cargo accurately, including weight, special requirements (refrigeration, hazardous, oversized), and any legal permits required.
• Pay the agreed price to the driver promptly upon successful delivery.
• Comply with the Zimbabwe Roads Act, Environmental Management Act (for hazardous loads), and all applicable transport regulations.
• Not post a new job while you have a job with status Matched through In Transit.

You are solely responsible for any inaccuracies in your load description and for any regulatory penalties arising from incorrectly declared cargo.`,
  },
  {
    heading: 'Driver Responsibilities',
    role: 'driver',
    body: `As a driver you agree to:

• Maintain a valid Class 2 (or higher) driving licence at all times while using Loada.
• Keep your vehicle registration certificate and roadworthy certificate (fitness certificate) current and uploaded to the platform.
• Notify Loada immediately if any document expires, is suspended, or is revoked.
• Only accept loads within your truck's registered carrying capacity (in tonnes).
• Comply with the Zimbabwe Roads Act, Road Traffic Act, and all applicable transport and road-safety regulations.
• Not use the Loada app while driving. Any bid or acceptance must be made when safely stopped.

Loada may suspend your account immediately if any document expires or is found to be invalid.`,
  },
  {
    heading: 'Subscription & Payments',
    role: 'driver',
    body: `Loada charges drivers a flat subscription fee (Weekly, Monthly, or Annual) as displayed on the subscription screen. The subscription grants access to browse loads and place bids. It does not guarantee income or any minimum number of available loads.

Subscriptions renew automatically at the end of each billing period. You may cancel at any time via Settings; cancellation takes effect at the end of the current paid period. No pro-rata refunds are issued for early cancellation.

Payments are processed via Paynow (EcoCash, OneMoney, or card). If a renewal payment fails, Loada will retry once after 24 hours. If payment is still not received, your account will be suspended until payment is made. You will not be refunded for any subscription period during which your account was suspended due to non-payment.`,
  },
  {
    heading: 'Prohibited Conduct',
    body: `You must not:

• Create false, misleading, or duplicate listings or accounts.
• Harass, threaten, abuse, or discriminate against other users.
• Arrange cash payments outside the Loada system in order to evade platform fees or subscriptions.
• Reverse-engineer, scrape, decompile, or interfere with the Loada platform or infrastructure.
• Use the platform for any unlawful purpose, including the transport of illegal goods.
• Impersonate any person or entity, or misrepresent your affiliation with any person or entity.
• Circumvent, disable, or interfere with security-related features of the platform.

Violation of any prohibited-conduct rule may result in immediate account suspension and, where appropriate, referral to law enforcement.`,
  },
  {
    heading: 'Intellectual Property',
    body: `All content, trademarks, logos, software, and technology on the Loada platform are owned by or licensed to Loada Technologies (Private) Limited. You are granted a limited, non-exclusive, non-transferable licence to use the app for its intended purpose.

You may not copy, modify, distribute, or create derivative works from any Loada content without prior written consent.`,
  },
  {
    heading: 'Disclaimers & Limitation of Liability',
    body: `The Loada platform is provided "as is" without warranties of any kind, express or implied.

To the maximum extent permitted by Zimbabwean law, Loada is not liable for:

• Loss of or damage to cargo during transit.
• Delays in pickup or delivery.
• Disputes between shippers and drivers regarding price, cargo condition, or service quality.
• Any indirect, consequential, or incidental loss arising from use of the platform.

Our total aggregate liability to you shall not exceed the subscription fees you paid in the 30 days preceding the claim.`,
  },
  {
    heading: 'Indemnification',
    body: `You agree to indemnify, defend, and hold harmless Loada, its directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of:

• Your use of the platform.
• Your breach of these Terms.
• Your violation of any applicable law or third-party rights.
• Any cargo you post or transport through the platform.`,
  },
  {
    heading: 'Termination',
    body: `You may delete your account at any time via Settings > Delete account. All your data will be permanently removed subject to our retention obligations (see our Privacy Policy).

Loada may suspend or terminate your account at any time for breach of these Terms, illegal activity, or repeated policy violations, with immediate effect and without prior notice where the breach is serious.

For less serious matters, we will give 14 days' notice and an opportunity to remedy the breach.

Termination does not affect any rights or obligations that accrued before the termination date.`,
  },
  {
    heading: 'Governing Law & Disputes',
    body: `These Terms are governed by and construed in accordance with the laws of the Republic of Zimbabwe. Any dispute arising from or in connection with these Terms shall be submitted to the exclusive jurisdiction of the courts of Harare, Zimbabwe.

If any provision of these Terms is found to be unenforceable, the remaining provisions continue in full force and effect.`,
  },
  {
    heading: 'Changes to These Terms',
    body: `We may update these Terms from time to time. We will notify you within the app and ask you to re-accept if changes materially affect your rights. Continued use of the app after the effective date of revised Terms constitutes your acceptance of those changes.

The effective date at the top of this document indicates when these Terms were last updated.`,
  },
  {
    heading: 'Contact Us',
    body: `Questions about these Terms? Email us at ${LEGAL_EMAIL}.

For platform disputes or safety concerns, use the in-app Help & Support feature first. We aim to respond to all legal queries within 5 business days.`,
  },
];

// ---------------------------------------------------------------------------
// PRIVACY POLICY
// ---------------------------------------------------------------------------
export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: 'Data Controller',
    body: `Loada Technologies (Private) Limited is the data controller for all personal data processed through the Loada mobile application and associated services.

Contact: ${LEGAL_EMAIL}

This policy explains what data we collect, why we collect it, how we protect it, and what rights you have over it. It applies to all users of the Loada platform.`,
  },
  {
    heading: 'Data We Collect',
    body: `We collect the following categories of personal data:

Identity data
• Full name
• Phone number (used as your account identifier)

Driver-specific data
• Driving licence number, class, and expiry date
• Vehicle registration number
• Truck make, model, and year
• Truck and vehicle document photos

Location data
• Real-time GPS coordinates while you are online and on an active job (drivers)
• Pickup and delivery addresses from posted loads (shippers)

Transaction data
• Loads posted, bids placed, job history
• Agreed prices and bid amounts
• Subscription plan and payment history

Communications
• In-app chat messages with matched parties
• Proof-of-delivery photos (uploaded by drivers)
• Delivery recipient name and signature

Technical data
• Device type and operating system version
• Push notification token (FCM)
• App crash reports and error logs (via Sentry)

Usage data
• Screens viewed and features used
• Session start and end timestamps`,
  },
  {
    heading: 'How We Use Your Data',
    body: `We use your data to:

• Create and manage your Loada account.
• Verify your identity via SMS one-time codes.
• Match drivers to available loads based on real-time GPS location, truck capacity, and subscription status.
• Display your profile (name, rating, truck details) to the matched shipper or driver on an active job.
• Process subscription payments through Paynow.
• Send push notifications and SMS alerts about bids, matches, and job updates.
• Detect, investigate, and prevent fraud, abuse, and policy violations.
• Improve the platform through anonymised, aggregated analytics.
• Comply with Zimbabwean law and respond to lawful requests from authorities.`,
  },
  {
    heading: 'Legal Bases for Processing',
    body: `We rely on the following legal bases to process your personal data:

Contract performance (Art. 6(1)(b) GDPR)
Processing necessary to deliver the Loada service to you — account creation, job matching, subscription management, and payments.

Legitimate interests (Art. 6(1)(f) GDPR)
Fraud prevention, platform safety, abuse detection, and anonymised analytics. Our legitimate interests do not override your fundamental rights.

Legal obligation (Art. 6(1)(c) GDPR)
Retaining financial records as required by the Zimbabwe Companies and Other Business Entities Act and tax law.

Consent (Art. 6(1)(a) GDPR)
Marketing communications, if you opt in. You may withdraw consent at any time without affecting the lawfulness of prior processing.`,
  },
  {
    heading: 'Sharing Your Data',
    body: `We share your personal data only where necessary:

With other users
When a job is matched, we share your name, phone number, star rating, and (for drivers) truck details with the other party for the duration of the job only.

With service providers
• Paynow — payment processing (Zimbabwe)
• Amazon Web Services (AWS S3) — secure file and document storage
• Google Firebase Cloud Messaging (FCM) — push notifications
• Google Maps Platform — address geocoding and route mapping
• BulkIT — SMS delivery (Zimbabwe)
• Sentry — crash and error reporting

With authorities
We will disclose data if required by a valid court order, subpoena, or lawful request from Zimbabwean law enforcement.

We never sell, rent, or trade your personal data to third parties for marketing purposes.`,
  },
  {
    heading: 'International Data Transfers',
    body: `Some of our service providers (AWS, Google, Sentry) store and process data on servers located outside Zimbabwe and outside the European Economic Area (EEA).

Where such transfers occur, we rely on appropriate safeguards, including the European Commission's Standard Contractual Clauses (SCCs) or equivalent mechanisms recognised under applicable law, to ensure your data receives an adequate level of protection.`,
  },
  {
    heading: 'Data Retention',
    body: `We retain your personal data for as long as your account is active.

After account deletion, we retain data for the following periods:

• Payment and transaction records — 7 years (required by Zimbabwean tax and company law)
• In-app chat messages — deleted within 90 days
• Proof-of-delivery photos — deleted within 12 months
• GPS location history — deleted within 30 days
• Driver document copies — deleted within 90 days of account deletion or document expiry
• Crash and error logs — deleted within 90 days

One-time verification codes (OTPs) expire after 10 minutes and are not stored after expiry.

You may request early deletion of data not subject to a legal retention obligation by emailing ${LEGAL_EMAIL}.`,
  },
  {
    heading: 'Your Rights',
    body: `Under applicable data protection law (including the GDPR where it applies), you have the following rights:

Right of access (Art. 15)
Request a copy of the personal data we hold about you.

Right to rectification (Art. 16)
Ask us to correct inaccurate or incomplete data.

Right to erasure (Art. 17)
Request deletion of your data where we no longer have a lawful basis to retain it.

Right to restriction (Art. 18)
Ask us to pause processing of your data in certain circumstances.

Right to data portability (Art. 20)
Receive your data in a structured, machine-readable format.

Right to object (Art. 21)
Object to processing based on our legitimate interests.

Right to withdraw consent (Art. 7(3))
Where processing is based on consent, withdraw it at any time without affecting the lawfulness of prior processing.

Right to lodge a complaint
You have the right to lodge a complaint with the data protection authority in your jurisdiction.

To exercise any of these rights, email us at ${LEGAL_EMAIL}. We will respond within 30 days. We may need to verify your identity before fulfilling your request.`,
  },
  {
    heading: "Children's Privacy",
    body: `Loada is not intended for use by anyone under 18 years of age. We do not knowingly collect personal data from children.

If we discover that a user is under 18, we will immediately delete their account and all associated personal data. If you believe a child has created a Loada account, please contact us at ${LEGAL_EMAIL}.`,
  },
  {
    heading: 'Security',
    body: `We implement industry-standard security measures to protect your personal data, including:

• TLS/HTTPS encryption for all data in transit.
• Encrypted storage for sensitive documents (driving licences, vehicle certificates).
• Private, non-public file storage with time-limited (signed) access URLs.
• Phone number hashing in our database — we do not store phone numbers in plaintext.
• OTP-based authentication — no passwords to be stolen or guessed.
• Regular security reviews and dependency updates.

No system is completely secure. If you discover a security vulnerability in Loada, please report it responsibly to ${LEGAL_SECURITY_EMAIL}.`,
  },
  {
    heading: 'Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you within the app and, where required by law, ask for your renewed consent.

The effective date at the top of this document shows when the policy was last updated. We encourage you to review this policy periodically.`,
  },
  {
    heading: 'Contact & Complaints',
    body: `Data controller:
Loada Technologies (Private) Limited
${LEGAL_EMAIL}

For privacy queries or to exercise your rights, email us at ${LEGAL_EMAIL}. We aim to respond within 30 days.

If you are not satisfied with our response, you have the right to lodge a complaint with the data protection supervisory authority in your country of residence.`,
  },
];
