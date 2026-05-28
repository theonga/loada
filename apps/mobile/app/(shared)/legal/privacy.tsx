import React from 'react';
import { LegalDoc } from '@components/ui/LegalDoc';
import { PRIVACY_SECTIONS } from '@constants/legal';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDoc
      title="Privacy Policy"
      sections={PRIVACY_SECTIONS}
    />
  );
}
