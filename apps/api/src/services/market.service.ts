import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import crypto from "crypto";
import { getDirections } from "@/lib/google-maps";
import { getConfigNum } from "@/lib/app-config";
import type { ConfigKey } from "@/lib/app-config";

export interface MarketReference {
  low: number | null;
  median: number | null;
  high: number | null;
  jobCount: number;
  estimatedMatchMinutes: number;
  isFallback: boolean;
}

async function getPerKmRate(tonnes: number): Promise<number> {
  const keyMap: Record<number, ConfigKey> = {
    1: "per_km_rate_1t",
    2: "per_km_rate_2t",
    5: "per_km_rate_5t",
    10: "per_km_rate_10t",
    20: "per_km_rate_20t",
    30: "per_km_rate_30t",
  };
  const key = keyMap[tonnes];
  return key ? getConfigNum(key) : 0.5;
}

export async function getMarketReference(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  tonnes: number,
): Promise<MarketReference> {
  const routeHash = crypto
    .createHash("md5")
    .update(`${originLat.toFixed(3)},${originLng.toFixed(3)},${destLat.toFixed(3)},${destLng.toFixed(3)}`)
    .digest("hex");
  const cacheKey = `loada:market:${routeHash}:${tonnes}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as MarketReference;

  const [minSample, cacheTtl] = await Promise.all([
    getConfigNum("market_ref_min_sample"),
    getConfigNum("market_ref_cache_ttl_seconds"),
  ]);

  const rows = await prisma.$queryRaw<
    Array<{ job_count: bigint; low: string | null; median: string | null; high: string | null }>
  >`
    SELECT
      COUNT(*)::bigint AS job_count,
      MIN(b."offeredPrice")::text AS low,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b."offeredPrice")::text AS median,
      MAX(b."offeredPrice")::text AS high
    FROM "Job" j
    JOIN "Bid" b ON b.id = j."matchedBidId"
    WHERE
      j.status IN ('DELIVERED', 'COMPLETED')
      AND j."requiredTonnes" = ${tonnes}
      AND j."createdAt" > NOW() - INTERVAL '30 days'
      AND ST_Distance(
        ST_SetSRID(ST_Point(j."originLng", j."originLat"), 4326)::geography,
        ST_SetSRID(ST_Point(${originLng}, ${originLat}), 4326)::geography
      ) < 50000
      AND ST_Distance(
        ST_SetSRID(ST_Point(j."destLng", j."destLat"), 4326)::geography,
        ST_SetSRID(ST_Point(${destLng}, ${destLat}), 4326)::geography
      ) < 50000
  `;

  const row = rows[0];
  const jobCount = Number(row.job_count);

  let result: MarketReference;

  if (jobCount < minSample) {
    let distanceKm = 50;
    try {
      const directions = await getDirections(
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng },
      );
      distanceKm = directions.distanceM / 1000;
    } catch {
      // fallback to estimate
    }

    const rate = await getPerKmRate(tonnes);
    const estimate = Math.round(distanceKm * rate * tonnes);
    result = {
      low: Math.round(estimate * 0.8),
      median: estimate,
      high: Math.round(estimate * 1.2),
      jobCount,
      estimatedMatchMinutes: 5,
      isFallback: true,
    };
  } else {
    result = {
      low: row.low ? parseFloat(row.low) : null,
      median: row.median ? parseFloat(row.median) : null,
      high: row.high ? parseFloat(row.high) : null,
      jobCount,
      estimatedMatchMinutes: 3,
      isFallback: false,
    };
  }

  await redis.setex(cacheKey, cacheTtl, JSON.stringify(result));
  return result;
}
