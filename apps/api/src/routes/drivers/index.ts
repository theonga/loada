import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { requireAuth, requireDriver } from "@/middleware/auth";
import { updateDriverSchema, driverOnlineSchema, earningsQuerySchema } from "@/schemas/driver.schema";
import { setDriverOnline, setDriverOffline } from "@/services/location.service";
import { getEarningsSummary } from "@/services/earnings.service";
import { prisma } from "@/lib/prisma";
import { resolveStoredFiles } from "@/lib/s3";
import dayjs from "dayjs";

// Resolve all of a driver's S3-backed file references to fresh presigned URLs
// in one batch. Mutates a copy of the driver object so the caller can pass it
// straight through to the response.
async function attachFreshFileUrls<T extends {
  licenceUrl?: string | null;
  licenceBackUrl?: string | null;
  registrationUrl?: string | null;
  truckPhotoUrl?: string | null;
  vehicleSidePhotoUrl?: string | null;
}>(driver: T): Promise<T> {
  const resolved = await resolveStoredFiles({
    licenceUrl: driver.licenceUrl ?? null,
    licenceBackUrl: driver.licenceBackUrl ?? null,
    registrationUrl: driver.registrationUrl ?? null,
    truckPhotoUrl: driver.truckPhotoUrl ?? null,
    vehicleSidePhotoUrl: driver.vehicleSidePhotoUrl ?? null,
  });
  return { ...driver, ...resolved };
}

type AuthUser = { id: string; driverProfile?: { id: string } | null };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

export async function driverRoutes(app: FastifyInstance) {
  app.get("/me", { preHandler: [requireDriver] }, async (req, reply) => {
    const user = getUser(req);
    if (!user.driverProfile) {
      return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
    }
    const driver = await prisma.driverProfile.findUnique({
      where: { id: user.driverProfile.id },
      include: { subscription: { include: { payments: true } }, user: { select: { id: true, name: true, phone: true, email: true, profilePhotoUrl: true } } },
    });
    if (!driver) {
      return reply.status(404).send({ success: false, error: { code: "DRIVER_NOT_FOUND", message: "Driver not found" } });
    }
    const withUrls = await attachFreshFileUrls(driver);
    return reply.send({
      success: true,
      data: {
        driver: withUrls,
        subscription: driver.subscription,
        documents: {
          licenceUrl: withUrls.licenceUrl,
          registrationUrl: withUrls.registrationUrl,
          status: driver.documentStatus,
        },
      },
    });
  });

  app.patch("/me", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const body = updateDriverSchema.parse(req.body);
      const user = getUser(req);
      if (!user.driverProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }
      const driver = await prisma.driverProfile.update({ where: { id: user.driverProfile.id }, data: body });
      return reply.send({ success: true, data: { driver } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  // Going online requires approved documents (enforced at matching time via getNearbyDrivers);
  // no subscription gate — Loada uses per-job commission.
  app.patch("/me/online", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const body = driverOnlineSchema.parse(req.body);
      const user = getUser(req);
      if (!user.driverProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }
      await setDriverOnline(user.driverProfile.id, body.lat, body.lng);
      return reply.send({ success: true, data: { isOnline: true } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.patch("/me/offline", { preHandler: [requireDriver] }, async (req, reply) => {
    const user = getUser(req);
    if (!user.driverProfile) {
      return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
    }
    await setDriverOffline(user.driverProfile.id);
    return reply.send({ success: true, data: { isOnline: false } });
  });

  app.get("/me/earnings", { preHandler: [requireDriver] }, async (req, reply) => {
    try {
      const query = earningsQuerySchema.parse(req.query);
      const user = getUser(req);
      if (!user.driverProfile) {
        return reply.status(400).send({ success: false, error: { code: "NO_DRIVER_PROFILE", message: "No driver profile" } });
      }
      const to = query.to ? new Date(query.to) : new Date();
      const from = query.from ? new Date(query.from) : dayjs(to).subtract(7, "day").toDate();
      const earnings = await getEarningsSummary(user.driverProfile.id, from, to);
      return reply.send({ success: true, data: { earnings } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  app.get("/:profileId", { preHandler: [requireAuth] }, async (req, reply) => {
    const { profileId } = req.params as { profileId: string };
    const driver = await prisma.driverProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        userId: true,
        truckType: true,
        capacityTonnes: true,
        truckRegistration: true,
        truckMake: true,
        truckModel: true,
        truckYear: true,
        truckPhotoUrl: true,
        vehicleSidePhotoUrl: true,
        documentStatus: true,
        isOnline: true,
        lastLocationLat: true,
        lastLocationLng: true,
        user: { select: { id: true, name: true, profilePhotoUrl: true } },
      },
    });
    if (!driver) {
      return reply.status(404).send({ success: false, error: { code: "DRIVER_NOT_FOUND", message: "Driver not found" } });
    }
    const withUrls = await attachFreshFileUrls(driver);
    return reply.send({ success: true, data: { driver: withUrls } });
  });
}
