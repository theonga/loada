import React from 'react';
import { LegalDoc } from '@components/ui/LegalDoc';
import { TERMS_SECTIONS } from '@constants/legal';
import { useAuthStore } from '@store/auth.store';

export default function TermsOfUseScreen() {
  const role = useAuthStore((s) => s.role) ?? undefined;
  return (
    <LegalDoc
      title="Terms of Use"
      sections={TERMS_SECTIONS}
      role={role}
    />
  );
}
