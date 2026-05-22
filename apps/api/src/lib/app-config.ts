import { prisma } from "./prisma";
import { redis } from "./redis";

const CACHE_TTL = 60; // config values cached for 60s in Redis
const CACHE_PREFIX = "loada:config:";

export type ConfigKey =
  | "subscription_price_weekly"
  | "subscription_price_monthly"
  | "subscription_price_annual"
  | "bid_ttl_seconds"
  | "initial_search_radius_km"
  | "radius_expansion_interval_seconds"
  | "radius_expansion_increment_km"
  | "radius_expansion_max_count"
  | "max_active_bids_per_driver"
  | "trial_period_days"
  | "otp_expiry_seconds"
  | "paynow_poll_interval_seconds"
  | "paynow_poll_timeout_seconds"
  | "market_ref_cache_ttl_seconds"
  | "market_ref_min_sample"
  | "per_km_rate_1t"
  | "per_km_rate_2t"
  | "per_km_rate_5t"
  | "per_km_rate_10t"
  | "per_km_rate_20t"
  | "per_km_rate_30t";

export const CONFIG_DEFAULTS: Record<ConfigKey, string> = {
  subscription_price_weekly: "8",
  subscription_price_monthly: "28",
  subscription_price_annual: "280",
  bid_ttl_seconds: "300",
  initial_search_radius_km: "25",
  radius_expansion_interval_seconds: "60",
  radius_expansion_increment_km: "15",
  radius_expansion_max_count: "3",
  max_active_bids_per_driver: "3",
  trial_period_days: "7",
  otp_expiry_seconds: "600",
  paynow_poll_interval_seconds: "10",
  paynow_poll_timeout_seconds: "300",
  market_ref_cache_ttl_seconds: "3600",
  market_ref_min_sample: "5",
  per_km_rate_1t: "0.30",
  per_km_rate_2t: "0.40",
  per_km_rate_5t: "0.50",
  per_km_rate_10t: "0.60",
  per_km_rate_20t: "0.70",
  per_km_rate_30t: "0.80",
};

export const CONFIG_META: Record<ConfigKey, { label: string; group: string }> = {
  subscription_price_weekly:           { label: "Weekly subscription price (USD)", group: "pricing" },
  subscription_price_monthly:          { label: "Monthly subscription price (USD)", group: "pricing" },
  subscription_price_annual:           { label: "Annual subscription price (USD)", group: "pricing" },
  bid_ttl_seconds:                     { label: "Bid TTL (seconds)", group: "bidding" },
  initial_search_radius_km:            { label: "Initial driver search radius (km)", group: "matching" },
  radius_expansion_interval_seconds:   { label: "Radius expansion interval (seconds)", group: "matching" },
  radius_expansion_increment_km:       { label: "Radius expansion increment (km)", group: "matching" },
  radius_expansion_max_count:          { label: "Max radius expansions", group: "matching" },
  max_active_bids_per_driver:          { label: "Max active bids per driver", group: "bidding" },
  trial_period_days:                   { label: "Trial period (days)", group: "pricing" },
  otp_expiry_seconds:                  { label: "OTP expiry (seconds)", group: "auth" },
  paynow_poll_interval_seconds:        { label: "Paynow poll interval (seconds)", group: "payments" },
  paynow_poll_timeout_seconds:         { label: "Paynow poll timeout (seconds)", group: "payments" },
  market_ref_cache_ttl_seconds:        { label: "Market reference cache TTL (seconds)", group: "market" },
  market_ref_min_sample:               { label: "Market reference minimum sample size", group: "market" },
  per_km_rate_1t:                      { label: "Per-km rate — 1 tonne (USD)", group: "market" },
  per_km_rate_2t:                      { label: "Per-km rate — 2 tonnes (USD)", group: "market" },
  per_km_rate_5t:                      { label: "Per-km rate — 5 tonnes (USD)", group: "market" },
  per_km_rate_10t:                     { label: "Per-km rate — 10 tonnes (USD)", group: "market" },
  per_km_rate_20t:                     { label: "Per-km rate — 20 tonnes (USD)", group: "market" },
  per_km_rate_30t:                     { label: "Per-km rate — 30 tonnes (USD)", group: "market" },
};

export async function getConfig(key: ConfigKey): Promise<string> {
  const cacheKey = `${CACHE_PREFIX}${key}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return cached;

  const row = await prisma.appConfig.findUnique({ where: { key } });
  const value = row?.value ?? CONFIG_DEFAULTS[key];

  await redis.setex(cacheKey, CACHE_TTL, value);
  return value;
}

export async function getConfigNum(key: ConfigKey): Promise<number> {
  return parseFloat(await getConfig(key));
}

export async function setConfig(key: ConfigKey, value: string, adminUsername: string): Promise<void> {
  await prisma.appConfig.upsert({
    where: { key },
    create: { key, value, label: CONFIG_META[key].label, group: CONFIG_META[key].group, updatedBy: adminUsername },
    update: { value, updatedBy: adminUsername },
  });
  await redis.del(`${CACHE_PREFIX}${key}`);
}

export async function getAllConfig(): Promise<Record<string, { value: string; label: string; group: string; updatedAt: Date | null; updatedBy: string | null }>> {
  const rows = await prisma.appConfig.findMany();
  const rowMap = Object.fromEntries(rows.map((r) => [r.key, r]));

  const result: Record<string, { value: string; label: string; group: string; updatedAt: Date | null; updatedBy: string | null }> = {};
  for (const [key, meta] of Object.entries(CONFIG_META) as [ConfigKey, { label: string; group: string }][]) {
    const row = rowMap[key];
    result[key] = {
      value: row?.value ?? CONFIG_DEFAULTS[key],
      label: meta.label,
      group: meta.group,
      updatedAt: row?.updatedAt ?? null,
      updatedBy: row?.updatedBy ?? null,
    };
  }
  return result;
}

export async function seedDefaultConfig(): Promise<void> {
  for (const [key, defaultValue] of Object.entries(CONFIG_DEFAULTS) as [ConfigKey, string][]) {
    const existing = await prisma.appConfig.findUnique({ where: { key } });
    if (!existing) {
      await prisma.appConfig.create({
        data: {
          key,
          value: defaultValue,
          label: CONFIG_META[key].label,
          group: CONFIG_META[key].group,
        },
      });
    }
  }
}
