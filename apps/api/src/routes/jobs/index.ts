import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { requireAuth, requireDriver, requireShipper } from "@/middleware/auth";
import { createJobSchema, jobsQuerySchema, marketRefQuerySchema, jobStatusUpdateSchema } from "@/schemas/job.schema";
import { createJob, getAvailableLoads, getJobById, cancelJob, getShipperJobs, transitionJobStatus } from "@/services/job.service";
import { getMarketReference } from "@/services/market.service";

type AuthUser = { id: string; driverProfile?: { id: string } | null; shipperProfile?: { id: string } | null };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

export async function jobRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: [requireShipper] }, async (req, reply) => {
    try {
      const body = createJobSchema.parse(req.body);
      const user = getUser(req);
      if (!user.shipperProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_SHIPPER_PROFILE", message: "No shipper profile found" } });
      }
      const job = await createJob(user.shipperProfile.id, body);
      return reply.status(201).send({ success: true, data: { job } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const query = jobsQuerySchema.parse(req.query);
      const user = getUser(req);

      if (query.role === "driver" || (!query.role && user.driverProfile)) {
        if (!user.driverProfile) {
          return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
        }
        if (!query.lat || !query.lng) {
          return reply.status(400).send({ success: false, error: { code: "LOCATION_REQUIRED", message: "lat and lng required for driver loads" } });
        }
        const jobs = await getAvailableLoads(user.driverProfile.id, query.lat, query.lng);
        return reply.send({ success: true, data: { jobs } });
      }

      if (!user.shipperProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_SHIPPER_PROFILE", message: "No shipper profile" } });
      }
      const jobs = await getShipperJobs(user.shipperProfile.id);
      return reply.send({ success: true, data: { jobs } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/:jobId", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const job = await getJobById(jobId);
      return reply.send({ success: true, data: { job } });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.patch("/:jobId/cancel", { preHandler: [requireShipper] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const user = getUser(req);
      await cancelJob(jobId, user.id);
      return reply.send({ success: true, data: null });
    } catch (err) {
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.patch("/:jobId/status", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const body = jobStatusUpdateSchema.parse(req.body);
      const user = getUser(req);
      const job = await getJobById(jobId);
      if (job.matchedDriverId !== user.driverProfile?.id) {
        return reply.status(403).send({ success: false, error: { code: "FORBIDDEN", message: "Not the matched driver for this job" } });
      }
      await transitionJobStatus(jobId, body.status);
      const updated = await getJobById(jobId);
      return reply.send({ success: true, data: { job: updated } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/:jobId/market-reference", { preHandler: [requireAuth] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const query = marketRefQuerySchema.parse(req.query);
      const job = await getJobById(jobId);
      const marketReference = await getMarketReference(
        job.originLat,
        job.originLng,
        job.destLat,
        job.destLng,
        query.tonnes,
      );
      return reply.send({ success: true, data: { marketReference } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });
}
