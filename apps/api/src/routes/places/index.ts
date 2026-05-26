import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";
import { requireAuth } from "@/middleware/auth";
import { placesAutocomplete, placeDetails, reverseGeocode } from "@/lib/google-maps";

const autocompleteQuerySchema = z.object({
  input: z.string().min(2, "Minimum 2 characters"),
  sessiontoken: z.string().min(1),
});

const detailsQuerySchema = z.object({
  placeId: z.string().min(1),
  sessiontoken: z.string().optional(),
});

const reverseGeocodeQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

export async function placesRoutes(app: FastifyInstance) {
  app.get("/autocomplete", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { input, sessiontoken } = autocompleteQuerySchema.parse(req.query);
      const predictions = await placesAutocomplete(input, sessiontoken);
      return reply.send({ success: true, data: { predictions } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: err.issues[0]?.message ?? "Invalid input" } });
      }
      throw err;
    }
  });

  app.get("/details", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { placeId, sessiontoken } = detailsQuerySchema.parse(req.query);
      const place = await placeDetails(placeId, sessiontoken);
      return reply.send({ success: true, data: { place } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input" } });
      }
      throw err;
    }
  });

  app.get("/reverse-geocode", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { lat, lng } = reverseGeocodeQuerySchema.parse(req.query);
      const result = await reverseGeocode(lat, lng);
      return reply.send({ success: true, data: { address: result.address } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input" } });
      }
      throw err;
    }
  });
}
