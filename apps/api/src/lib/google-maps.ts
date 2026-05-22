import { Client, TravelMode } from "@googlemaps/google-maps-services-js";
import { redis } from "./redis";

const mapsClient = new Client({});

export async function geocode(address: string): Promise<{ lat: number; lng: number }> {
  const cacheKey = `loada:geocode:${Buffer.from(address).toString("base64")}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as { lat: number; lng: number };

  const res = await mapsClient.geocode({
    params: { address, key: process.env.GOOGLE_MAPS_API_KEY! },
  });
  const location = res.data.results[0].geometry.location;
  const result = { lat: location.lat, lng: location.lng };
  await redis.setex(cacheKey, 604800, JSON.stringify(result));
  return result;
}

export async function getDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ distanceM: number; durationS: number }> {
  const res = await mapsClient.directions({
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: TravelMode.driving,
      key: process.env.GOOGLE_MAPS_API_KEY!,
    },
  });
  const leg = res.data.routes[0].legs[0];
  return {
    distanceM: leg.distance.value,
    durationS: leg.duration.value,
  };
}
