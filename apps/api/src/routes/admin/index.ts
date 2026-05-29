import type { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAdmin } from "@/middleware/admin-auth";
import { getAllConfig, setConfig } from "@/lib/app-config";
import type { ConfigKey } from "@/lib/app-config";
import { resolveStoredFiles } from "@/lib/s3";
import { adminCancelJob, adminBulkCancelJobs } from "@/services/job.service";

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
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalUsers, totalDrivers, totalShippers,
      totalJobs, activeJobs,
      completedJobsToday, pendingDocuments,
      walletFunds, commissionAllTime, commissionThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.driverProfile.count(),
      prisma.shipperProfile.count(),
      prisma.job.count(),
      prisma.job.count({ where: { status: { in: ["POSTED", "BIDDING", "MATCHED", "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT"] } } }),
      prisma.job.count({ where: { status: "COMPLETED", updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.driverProfile.count({ where: { documentStatus: "PENDING" } }),
      prisma.driverWallet.aggregate({ _sum: { balance: true, reservedBalance: true } }),
      prisma.walletTransaction.aggregate({ where: { type: "COMMISSION_DEDUCT" }, _sum: { amount: true } }),
      prisma.walletTransaction.aggregate({ where: { type: "COMMISSION_DEDUCT", createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    ]);

    return reply.send({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDrivers,
          totalShippers,
          totalJobs,
          activeJobs,
          completedJobsToday,
          pendingDocuments,
          totalWalletFunds: Number(walletFunds._sum.balance ?? 0) + Number(walletFunds._sum.reservedBalance ?? 0),
          totalCommissionCollected: Number(commissionAllTime._sum.amount ?? 0),
          commissionThisMonth: Number(commissionThisMonth._sum.amount ?? 0),
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

    // Refresh every document/photo URL so admin sees working links even for
    // drivers who uploaded weeks ago. The stored value is the S3 key.
    const driversWithUrls = await Promise.all(
      drivers.map(async (d) => {
        const fresh = await resolveStoredFiles({
          licenceUrl: d.licenceUrl,
          licenceBackUrl: d.licenceBackUrl,
          registrationUrl: d.registrationUrl,
          truckPhotoUrl: d.truckPhotoUrl,
          vehicleSidePhotoUrl: d.vehicleSidePhotoUrl,
        });
        return { ...d, ...fresh };
      }),
    );

    return reply.send({ success: true, data: { drivers: driversWithUrls, total, page: query.page, limit: query.limit } });
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
      const admin = getAdmin(req);

      // Routes through the shared cancellation helper so reserved commissions
      // are released, pending bids are rejected, the driver + shipper are
      // notified, and the live socket event fires — same as a shipper cancel.
      await adminCancelJob(jobId, admin.username, reason);

      const updated = await prisma.job.findUnique({ where: { id: jobId } });
      return reply.send({ success: true, data: { job: updated } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  // ── Analytics ─────────────────────────────────────────────────────────────────

  app.get("/analytics", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const query = z.object({
        from:        z.string().datetime().optional(),
        to:          z.string().datetime().optional(),
        granularity: z.enum(["day", "week", "month"]).default("day"),
      }).parse(req.query);

      const to   = query.to   ? new Date(query.to)   : new Date();
      const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const trunc = query.granularity;

      // Time-series: jobs created + completed per period
      const jobSeries = await prisma.$queryRaw<Array<{ date: Date; created: bigint; completed: bigint }>>`
        SELECT
          DATE_TRUNC(${trunc}, "createdAt") AS date,
          COUNT(*) AS created,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed
        FROM "Job"
        WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY 1
        ORDER BY 1
      `;

      // Time-series: commission revenue per period (deducted from driver wallets)
      const revenueSeries = await prisma.$queryRaw<Array<{ date: Date; amount: unknown }>>`
        SELECT
          DATE_TRUNC(${trunc}, "createdAt") AS date,
          SUM(amount) AS amount
        FROM "WalletTransaction"
        WHERE type = 'COMMISSION_DEDUCT'
          AND "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY 1
        ORDER BY 1
      `;

      // Time-series: new users per period
      const userSeries = await prisma.$queryRaw<Array<{ date: Date; new_users: bigint }>>`
        SELECT
          DATE_TRUNC(${trunc}, "createdAt") AS date,
          COUNT(*) AS new_users
        FROM "User"
        WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY 1
        ORDER BY 1
      `;

      // Breakdown: current job counts by status
      const jobsByStatus = await prisma.job.groupBy({
        by: ["status"],
        _count: { _all: true },
      });

      // Breakdown: driver wallet balance distribution
      const walletRows = await prisma.driverWallet.findMany({ select: { balance: true } });
      const walletBands = { "No balance": 0, "$0.01–$9": 0, "$10–$49": 0, "$50+": 0 };
      for (const w of walletRows) {
        const b = Number(w.balance);
        if (b <= 0) walletBands["No balance"]++;
        else if (b < 10) walletBands["$0.01–$9"]++;
        else if (b < 50) walletBands["$10–$49"]++;
        else walletBands["$50+"]++;
      }

      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      return reply.send({
        success: true,
        data: {
          series: {
            jobs: jobSeries.map((r) => ({
              date:      fmt(r.date),
              created:   Number(r.created),
              completed: Number(r.completed),
            })),
            revenue: revenueSeries.map((r) => ({
              date:   fmt(r.date),
              amount: Number(r.amount ?? 0),
            })),
            users: userSeries.map((r) => ({
              date:     fmt(r.date),
              newUsers: Number(r.new_users),
            })),
          },
          breakdown: {
            jobsByStatus: Object.fromEntries(jobsByStatus.map((r) => [r.status, r._count._all])),
            walletBalanceBands: walletBands,
          },
        },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  // ── Bulk user actions ─────────────────────────────────────────────────────────

  app.post("/users/bulk-suspend", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { ids, reason } = z.object({
        ids:    z.array(z.string().uuid()).min(1),
        reason: z.string().min(1),
      }).parse(req.body);

      const { count } = await prisma.user.updateMany({
        where: { id: { in: ids } },
        data:  { isSuspended: true, suspensionReason: reason },
      });

      return reply.send({ success: true, data: { updated: count } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  app.post("/users/bulk-unsuspend", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(req.body);

      const { count } = await prisma.user.updateMany({
        where: { id: { in: ids } },
        data:  { isSuspended: false, suspensionReason: null },
      });

      return reply.send({ success: true, data: { updated: count } });
    } catch (err) {
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  // ── Bulk driver document actions ──────────────────────────────────────────────

  app.post("/drivers/bulk-approve-docs", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1) }).parse(req.body);

      const { count } = await prisma.driverProfile.updateMany({
        where: { id: { in: ids } },
        data:  { documentStatus: "APPROVED" },
      });

      return reply.send({ success: true, data: { updated: count } });
    } catch (err) {
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  app.post("/drivers/bulk-reject-docs", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { ids, reason } = z.object({
        ids:    z.array(z.string().uuid()).min(1),
        reason: z.string().min(1),
      }).parse(req.body);

      void reason;
      const { count } = await prisma.driverProfile.updateMany({
        where: { id: { in: ids } },
        data:  { documentStatus: "REJECTED" },
      });

      return reply.send({ success: true, data: { updated: count } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      return reply.status(500).send({ success: false, error: { code: "ERROR", message: (err as Error).message } });
    }
  });

  // ── Bulk job cancel ───────────────────────────────────────────────────────────

  app.post("/jobs/bulk-cancel", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { ids, reason } = z.object({
        ids:    z.array(z.string().uuid()).min(1),
        reason: z.string().min(1),
      }).parse(req.body);
      const admin = getAdmin(req);

      // Per-job cancellation with the same cleanup as the single endpoint.
      // Already-terminal jobs are skipped, not failed.
      const { cancelled, skipped } = await adminBulkCancelJobs(ids, admin.username, reason);

      return reply.send({ success: true, data: { updated: cancelled, skipped } });
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.status(400).send({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: err.issues } });
      }
      const e = err as { statusCode?: number; code?: string; message: string };
      return reply.status(e.statusCode ?? 500).send({ success: false, error: { code: e.code ?? "ERROR", message: e.message } });
    }
  });

  // ── Wallets ───────────────────────────────────────────────────────────────────

  app.get("/wallets", { preHandler: [requireAdmin] }, async (req, reply) => {
    const query = z.object({
      page:  z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
      search: z.string().optional(),
    }).parse(req.query);

    const userWhere = query.search
      ? { name: { contains: query.search, mode: "insensitive" as const } }
      : undefined;
    const where = userWhere ? { driver: { user: userWhere } } : {};

    // Stats are global (every wallet), not page-scoped, so the page's
    // "Total funds held" matches the overview KPI exactly.
    // Definition: balance + reservedBalance, identical to /admin/stats.
    const [wallets, total, agg, zeroCount, driversCount] = await Promise.all([
      prisma.driverWallet.findMany({
        where,
        include: {
          driver: { include: { user: true } },
          transactions: { orderBy: { createdAt: "desc" }, take: 5 },
        },
        orderBy: { balance: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.driverWallet.count({ where }),
      prisma.driverWallet.aggregate({ _sum: { balance: true, reservedBalance: true } }),
      prisma.driverWallet.count({ where: { balance: 0, reservedBalance: 0 } }),
      prisma.driverWallet.count(),
    ]);

    const balanceSum  = Number(agg._sum.balance ?? 0);
    const reservedSum = Number(agg._sum.reservedBalance ?? 0);
    const totalHeld   = balanceSum + reservedSum;
    const avg         = driversCount > 0 ? totalHeld / driversCount : 0;

    return reply.send({
      success: true,
      data: {
        wallets,
        total,
        page: query.page,
        limit: query.limit,
        stats: {
          totalHeld,
          totalReserved: reservedSum,
          totalAvailable: balanceSum,
          zeroCount,
          driversCount,
          avg,
        },
      },
    });
  });

  app.patch("/wallets/:driverId/adjust", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const admin = getAdmin(req);
      const { driverId } = req.params as { driverId: string };
      const { amount, note } = z.object({
        amount: z.number().refine((n) => n !== 0, "Amount cannot be zero"),
        note:   z.string().min(1),
      }).parse(req.body);

      const wallet = await prisma.driverWallet.findUnique({ where: { driverId } });
      if (!wallet) {
        return reply.status(404).send({ success: false, error: { code: "NOT_FOUND", message: "Wallet not found" } });
      }

      const newBalance = Number(wallet.balance) + amount;
      if (newBalance < 0) {
        return reply.status(400).send({ success: false, error: { code: "INSUFFICIENT_BALANCE", message: "Adjustment would result in negative balance" } });
      }

      const [updated] = await prisma.$transaction([
        prisma.driverWallet.update({
          where: { driverId },
          data:  { balance: newBalance },
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type:     amount > 0 ? "DEPOSIT" : "REFUND",
            amount:   Math.abs(amount),
            note:     `Admin adjustment by ${admin.username}: ${note}`,
          },
        }),
      ]);

      return reply.send({ success: true, data: { wallet: updated } });
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
