import type { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAdmin } from "@/middleware/admin-auth";
import { getAllConfig, setConfig } from "@/lib/app-config";
import type { ConfigKey } from "@/lib/app-config";

export async function adminRoutes(app: FastifyInstance) {
  // ── Auth ─────────────────────────────────────────────────────────────────────

  app.post("/auth/login", async (req, reply) => {
    try {
      const { username, password } = z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }).parse(req.body);

      const admin = await prisma.admin.findUnique({ where: { username } });
      if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
        return reply.status(401).send({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" } });
      }

      const token = jwt.sign(
        { adminId: admin.id, username: admin.username, type: "admin" },
        process.env.ADMIN_JWT_SECRET ?? process.env.JWT_SECRET!,
        { expiresIn: "8h" },
      );

      return reply.send({ success: true, data: { token, username: admin.username } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  // ── Config ───────────────────────────────────────────────────────────────────

  app.get("/config", { preHandler: [requireAdmin] }, async (_req, reply) => {
    const config = await getAllConfig();
    return reply.send({ success: true, data: { config } });
  });

  app.patch("/config", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const admin = getAdmin(req);
      const updates = z.record(z.string(), z.string()).parse(req.body);

      const results: Record<string, string> = {};
      for (const [key, value] of Object.entries(updates)) {
        await setConfig(key as ConfigKey, value, admin.username);
        results[key] = value;
      }

      return reply.send({ success: true, data: { updated: results } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────────

  app.get("/stats", { preHandler: [requireAdmin] }, async (_req, reply) => {
    const [
      totalUsers, totalDrivers, totalShippers,
      activeSubscriptions, totalJobs, activeJobs,
      completedJobsToday, totalRevenue,
      pendingDocuments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.driverProfile.count(),
      prisma.shipperProfile.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: { in: ["POSTED", "BIDDING", "MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT"] } } }),
      prisma.job.count({ where: { status: "COMPLETED", updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.subscriptionPayment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.driverProfile.count({ where: { documentStatus: "PENDING" } }),
    ]);

    return reply.send({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDrivers,
          totalShippers,
          activeSubscriptions,
          totalJobs,
          activeJobs,
          completedJobsToday,
          totalRevenue: Number(totalRevenue._sum.amount ?? 0),
          pendingDocuments,
        },
      },
    });
  });

  // ── Users ─────────────────────────────────────────────────────────────────────

  app.get("/users", { preHandler: [requireAdmin] }, async (req, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
      role: z.enum(["SHIPPER", "DRIVER", "BOTH"]).optional(),
      search: z.string().optional(),
      suspended: z.coerce.boolean().optional(),
    }).parse(req.query);

    const where = {
      ...(query.role && { role: query.role }),
      ...(query.suspended !== undefined && { isSuspended: query.suspended }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          driverProfile: { include: { subscription: true } },
          shipperProfile: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return reply.send({ success: true, data: { users, total, page: query.page, limit: query.limit } });
  });

  app.patch("/users/:userId/suspend", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { userId } = req.params as { userId: string };
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isSuspended: true, suspensionReason: reason },
      });

      return reply.send({ success: true, data: { user } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  app.patch("/users/:userId/unsuspend", { preHandler: [requireAdmin] }, async (req, reply) => {
    const { userId } = req.params as { userId: string };
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false, suspensionReason: null },
    });
    return reply.send({ success: true, data: { user } });
  });

  // ── Drivers ───────────────────────────────────────────────────────────────────

  app.get("/drivers", { preHandler: [requireAdmin] }, async (req, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
      documentStatus: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "EXPIRED"]).optional(),
    }).parse(req.query);

    const where = query.documentStatus ? { documentStatus: query.documentStatus } : {};

    const [drivers, total] = await Promise.all([
      prisma.driverProfile.findMany({
        where,
        include: {
          user: true,
          subscription: { include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } },
        },
        orderBy: { user: { createdAt: "desc" } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.driverProfile.count({ where }),
    ]);

    return reply.send({ success: true, data: { drivers, total, page: query.page, limit: query.limit } });
  });

  app.patch("/drivers/:driverId/approve-docs", { preHandler: [requireAdmin] }, async (req, reply) => {
    const { driverId } = req.params as { driverId: string };
    const driver = await prisma.driverProfile.update({
      where: { id: driverId },
      data: { documentStatus: "APPROVED" },
      include: { user: true },
    });
    return reply.send({ success: true, data: { driver } });
  });

  app.patch("/drivers/:driverId/reject-docs", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { driverId } = req.params as { driverId: string };
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);

      const driver = await prisma.driverProfile.update({
        where: { id: driverId },
        data: { documentStatus: "REJECTED" },
        include: { user: true },
      });

      void reason;
      return reply.send({ success: true, data: { driver } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  // ── Jobs ──────────────────────────────────────────────────────────────────────

  app.get("/jobs", { preHandler: [requireAdmin] }, async (req, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
      status: z.string().optional(),
    }).parse(req.query);

    const where = query.status ? { status: query.status as never } : {};

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          shipper: { include: { user: true } },
          bids: { where: { status: "ACCEPTED" }, take: 1, include: { driver: { include: { user: true } } } },
          delivery: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.job.count({ where }),
    ]);

    return reply.send({ success: true, data: { jobs, total, page: query.page, limit: query.limit } });
  });

  app.patch("/jobs/:jobId/cancel", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);

      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Job not found" } });
      if (job.status === "COMPLETED" || job.status === "CANCELLED") {
        return reply.status(400).send({ success: false, error: { code: "INVALID_STATUS", message: "Job cannot be cancelled in its current state" } });
      }

      void reason;
      const updated = await prisma.job.update({ where: { id: jobId }, data: { status: "CANCELLED" } });
      return reply.send({ success: true, data: { job: updated } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  // ── Subscriptions ─────────────────────────────────────────────────────────────

  app.get("/subscriptions", { preHandler: [requireAdmin] }, async (req, reply) => {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
      status: z.enum(["TRIAL", "ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
    }).parse(req.query);

    const where = query.status ? { status: query.status } : {};

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          driver: { include: { user: true } },
          payments: { orderBy: { createdAt: "desc" }, take: 3 },
        },
        orderBy: { updatedAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.subscription.count({ where }),
    ]);

    return reply.send({ success: true, data: { subscriptions, total, page: query.page, limit: query.limit } });
  });

  app.patch("/subscriptions/:id/override", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const body = z.object({
        status: z.enum(["TRIAL", "ACTIVE", "EXPIRED", "CANCELLED"]),
        currentPeriodEnd: z.string().datetime().optional(),
      }).parse(req.body);

      const subscription = await prisma.subscription.update({
        where: { id },
        data: {
          status: body.status,
          ...(body.currentPeriodEnd && { currentPeriodEnd: new Date(body.currentPeriodEnd) }),
        },
        include: { driver: { include: { user: true } } },
      });

      return reply.send({ success: true, data: { subscription } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });
}
