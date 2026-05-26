export interface Country {
  name: string;
  code: string;   // ISO 3166-1 alpha-2
  dial: string;   // e.g. "+263"
  flag: string;   // emoji
  minDigits: number; // minimum local digits (after dial code)
}

// Primary target markets first, then alphabetical international
export const COUNTRIES: Country[] = [
  { name: 'Zimbabwe',          code: 'ZW', dial: '+263', flag: '🇿🇼', minDigits: 9 },
  { name: 'South Africa',      code: 'ZA', dial: '+27',  flag: '🇿🇦', minDigits: 9 },
  { name: 'Zambia',            code: 'ZM', dial: '+260', flag: '🇿🇲', minDigits: 9 },
  { name: 'Botswana',          code: 'BW', dial: '+267', flag: '🇧🇼', minDigits: 7 },
  { name: 'Mozambique',        code: 'MZ', dial: '+258', flag: '🇲🇿', minDigits: 8 },
  { name: 'Namibia',           code: 'NA', dial: '+264', flag: '🇳🇦', minDigits: 7 },
  { name: 'Malawi',            code: 'MW', dial: '+265', flag: '🇲🇼', minDigits: 7 },
  { name: 'Tanzania',          code: 'TZ', dial: '+255', flag: '🇹🇿', minDigits: 9 },
  { name: 'Kenya',             code: 'KE', dial: '+254', flag: '🇰🇪', minDigits: 9 },
  { name: 'Uganda',            code: 'UG', dial: '+256', flag: '🇺🇬', minDigits: 7 },
  { name: 'Nigeria',           code: 'NG', dial: '+234', flag: '🇳🇬', minDigits: 7 },
  { name: 'Ghana',             code: 'GH', dial: '+233', flag: '🇬🇭', minDigits: 9 },
  { name: 'United Kingdom',    code: 'GB', dial: '+44',  flag: '🇬🇧', minDigits: 7 },
  { name: 'United States',     code: 'US', dial: '+1',   flag: '🇺🇸', minDigits: 10 },
  { name: 'United Arab Emirates', code: 'AE', dial: '+971', flag: '🇦🇪', minDigits: 7 },
  { name: 'China',             code: 'CN', dial: '+86',  flag: '🇨🇳', minDigits: 7 },
  { name: 'India',             code: 'IN', dial: '+91',  flag: '🇮🇳', minDigits: 10 },
  { name: 'Australia',         code: 'AU', dial: '+61',  flag: '🇦🇺', minDigits: 5 },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Zimbabwe
