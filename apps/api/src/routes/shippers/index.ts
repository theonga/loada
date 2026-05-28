import type { FastifyInstance } from "fastify";
import { JobStatus } from "@prisma/client";
import { requireShipper } from "@/middleware/auth";
import { prisma } from "@/lib/prisma";

type AuthUser = { id: string; shipperProfile?: { id: string } | null };

function getUser(req: object): AuthUser {
  return (req as Record<string, unknown>)["authUser"] as AuthUser;
}

interface FrequentLocation {
  address: string;
  lat: number;
  lng: number;
  count: number;
}

export async function shipperRoutes(app: FastifyInstance) {
  // Returns the shipper's most-used pickup and dropoff locations derived from job history.
  // Used by the mobile app to pre-populate location suggestions in the route search overlay.
  app.get("/me/frequent-locations", { preHandler: [requireShipper] }, async (req, reply) => {
    const user = getUser(req);
    if (!user.shipperProfile) {
      return reply.status(400).send({
        success: false,
        error: { code: "NO_SHIPPER_PROFILE", message: "No shipper profile" },
      });
    }

    const jobs = await prisma.job.findMany({
      where: {
        shipperId: user.shipperProfile.id,
        status: { not: JobStatus.DRAFT },
      },
      select: {
        originAddress: true,
        originLat: true,
        originLng: true,
        destAddress: true,
        destLat: true,
        destLng: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const pickupMap = new Map<string, FrequentLocation>();
    const dropoffMap = new Map<string, FrequentLocation>();

    for (const job of jobs) {
      const pk = job.originAddress;
      const existingPickup = pickupMap.get(pk);
      if (existingPickup) {
        existingPickup.count++;
      } else {
        pickupMap.set(pk, { address: job.originAddress, lat: job.originLat, lng: job.originLng, count: 1 });
      }

      const dk = job.destAddress;
      const existingDropoff = dropoffMap.get(dk);
      if (existingDropoff) {
        existingDropoff.count++;
      } else {
        dropoffMap.set(dk, { address: job.destAddress, lat: job.destLat, lng: job.destLng, count: 1 });
      }
    }

    const pickups = [...pickupMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);
    const dropoffs = [...dropoffMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

    return reply.send({ success: true, data: { pickups, dropoffs } });
  });
}
