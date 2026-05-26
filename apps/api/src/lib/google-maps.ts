import { Client, TravelMode } from "@googlemaps/google-maps-services-js";
import { redis } from "./redis";

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

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

export async function placesAutocomplete(
  input: string,
  sessiontoken: string,
): Promise<PlacePrediction[]> {
  const cacheKey = `loada:places:ac:${Buffer.from(input.toLowerCase().trim()).toString("base64")}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as PlacePrediction[];

  const res = await mapsClient.placeAutocomplete({
    params: {
      input,
      sessiontoken,
      key: process.env.GOOGLE_MAPS_API_KEY!,
      language: "en",
      components: ["country:zw"],
    },
  });

  const predictions: PlacePrediction[] = res.data.predictions.map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting.main_text,
    secondaryText: p.structured_formatting.secondary_text ?? "",
  }));

  // Short TTL — autocomplete results change frequently
  await redis.setex(cacheKey, 900, JSON.stringify(predictions));
  return predictions;
}

export async function placeDetails(
  placeId: string,
  sessiontoken?: string,
): Promise<{ lat: number; lng: number; address: string }> {
  const cacheKey = `loada:place:detail:${placeId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as { lat: number; lng: number; address: string };

  const res = await mapsClient.placeDetails({
    params: {
      place_id: placeId,
      fields: ["geometry", "formatted_address"],
      key: process.env.GOOGLE_MAPS_API_KEY!,
      ...(sessiontoken ? { sessiontoken } : {}),
    },
  });

  const result = {
    lat: res.data.result.geometry!.location.lat as number,
    lng: res.data.result.geometry!.location.lng as number,
    address: res.data.result.formatted_address ?? "",
  };

  await redis.setex(cacheKey, 604800, JSON.stringify(result));
  return result;
}

export async function reverseGeocode(lat: number, lng: number): Promise<{ address: string }> {
  const cacheKey = `loada:rgeocode:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached) as { address: string };

  const res = await mapsClient.reverseGeocode({
    params: { latlng: { lat, lng }, key: process.env.GOOGLE_MAPS_API_KEY! },
  });

  const address = res.data.results[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const result = { address };
  await redis.setex(cacheKey, 86400, JSON.stringify(result));
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
