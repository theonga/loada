import type { FastifyInstance } from "fastify";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAdmin } from "@/middleware/admin-auth";
import { getAllConfig, setConfig } from "@/lib/app-config";
import type { ConfigKey } from "@/lib/app-config";
import { resolveStoredFiles } from "@/lib/s3";
import { adminCancelJob, adminBulkCancelJobs, adminSetJobStatus } from "@/services/job.service";
import type { JobStatus } from "@prisma/client";
import { getOnlineShipperCount } from "@/lib/socket";

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
      onlineDrivers, onlineShippers,
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
      // Drivers track online state in Postgres (toggled by their /me/online endpoint).
      prisma.driverProfile.count({ where: { isOnline: true } }),
      // Shippers have no isOnline field — we track them via socket presence in Redis.
      getOnlineShipperCount().catch(() => 0),
    ]);

    return reply.send({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalDrivers,
          totalShippers,
          onlineDrivers,
          onlineShippers,
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
          driverProfile: { include: { wallet: true } },
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
          wallet: true,
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
          bids: {
            include: { driver: { include: { user: true } } },
            orderBy: { createdAt: "asc" },
          },
          delivery: true,
          _count: { select: { bids: true, messages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.job.count({ where }),
    ]);

    return reply.send({ success: true, data: { jobs, total, page: query.page, limit: query.limit } });
  });

  /**
   * Full job detail for the admin modal — every related row the admin might
   * need to investigate an in-progress, disputed, or stuck job.
   */
  app.get("/jobs/:jobId", { preHandler: [requireAdmin] }, async (req, reply) => {
    const { jobId } = req.params as { jobId: string };
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        shipper: { include: { user: true } },
        bids: {
          orderBy: { createdAt: "desc" },
          include: { driver: { include: { user: true, wallet: true } } },
        },
        delivery: true,
        messages: { orderBy: { createdAt: "asc" }, take: 50, include: { sender: true } },
        ratings: { include: { fromUser: true, toUser: true } },
      },
    });
    if (!job) {
      return reply.status(404).send({ success: false, error: { code: "JOB_NOT_FOUND", message: "Job not found" } });
    }
    return reply.send({ success: true, data: { job } });
  });

  app.patch("/jobs/:jobId/status", { preHandler: [requireAdmin] }, async (req, reply) => {
    try {
      const { jobId } = req.params as { jobId: string };
      const { status, reason } = z.object({
        status: z.enum([
          "POSTED", "BIDDING", "RADIUS_EXPANDED", "MATCHED",
          "PICKUP_EN_ROUTE", "PICKUP_ARRIVED", "LOADED", "IN_TRANSIT",
          "DELIVERED", "COMPLETED", "CANCELLED", "DISPUTED", "EXPIRED",
        ]),
        reason: z.string().optional(),
      }).parse(req.body);
      const admin = getAdmin(req);

      await adminSetJobStatus(jobId, status as JobStatus, admin.username, reason);

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

  // ── Trust & safety audit ─────────────────────────────────────────────────────
  //
  // Surfaces the platform's two main collusion signals:
  //   - Flagged chat messages (off-platform negotiation, phone numbers, etc.)
  //   - Accepted bids that priced well below the market reference for the route
  //
  // Both are pure signals — no automated action is taken. Admin reviews and
  // decides whether to suspend, dispute, or ignore.

  app.get("/audit/flagged-messages", { preHandler: [requireAdmin] }, async (req, reply) => {
    const query = z.object({
      page:  z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
    }).parse(req.query);

    const where = { flaggedReason: { not: null } };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, phone: true, role: true } },
          job:    { select: { id: true, originAddress: true, destAddress: true, status: true, shipperId: true } },
        },
        orderBy: { createdAt: "desc" },
        skip:  (query.page - 1) * query.limit,
        take:  query.limit,
      }),
      prisma.message.count({ where }),
    ]);

    return reply.send({ success: true, data: { messages, total, page: query.page, limit: query.limit } });
  });

  app.get("/audit/low-bids", { preHandler: [requireAdmin] }, async (req, reply) => {
    const query = z.object({
      page:  z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
    }).parse(req.query);

    // Use the same per-km × tonnage rate table the market reference falls back
    // to. Anything where (accepted bid) / (estimated market) is below the
    // configured threshold gets flagged. We compute in SQL so it doesn't
    // matter how many jobs are on the platform.
    const lowBidPct = parseFloat((await getAllConfig())["low_bid_alert_pct"]?.value ?? "60");

    const rows = await prisma.$queryRaw<Array<{
      id: string;
      origin_address: string;
      dest_address: string;
      required_tonnes: number;
      asking_price: string;
      bid_price: string;
      currency: string;
      status: string;
      created_at: Date;
      shipper_name: string;
      driver_name: string;
      distance_km: number;
      estimated_market: number;
      ratio_pct: number;
    }>>`
      WITH job_with_bid AS (
        SELECT
          j.id,
          j."originAddress"   AS origin_address,
          j."destAddress"     AS dest_address,
          j."requiredTonnes"  AS required_tonnes,
          j."askingPrice"     AS asking_price,
          b."offeredPrice"    AS bid_price,
          j.currency,
          j.status,
          j."createdAt"       AS created_at,
          su.name             AS shipper_name,
          du.name             AS driver_name,
          ST_Distance(
            ST_SetSRID(ST_Point(j."originLng", j."originLat"), 4326)::geography,
            ST_SetSRID(ST_Point(j."destLng",   j."destLat"),   4326)::geography
          ) / 1000 AS distance_km,
          CASE j."requiredTonnes"
            WHEN  1 THEN COALESCE((SELECT value::float FROM "AppConfig" WHERE key = 'per_km_rate_1t'),  0.30)
            WHEN  2 THEN COALESCE((SELECT value::float FROM "AppConfig" WHERE key = 'per_km_rate_2t'),  0.40)
            WHEN  5 THEN COALESCE((SELECT value::float FROM "AppConfig" WHERE key = 'per_km_rate_5t'),  0.50)
            WHEN 10 THEN COALESCE((SELECT value::float FROM "AppConfig" WHERE key = 'per_km_rate_10t'), 0.60)
            WHEN 20 THEN COALESCE((SELECT value::float FROM "AppConfig" WHERE key = 'per_km_rate_20t'), 0.70)
            WHEN 30 THEN COALESCE((SELECT value::float FROM "AppConfig" WHERE key = 'per_km_rate_30t'), 0.80)
            ELSE 0.50
          END AS per_km_rate
        FROM "Job" j
        JOIN "Bid" b           ON b.id = j."matchedBidId"
        JOIN "ShipperProfile" sp ON sp.id = j."shipperId"
        JOIN "User"   su       ON su.id = sp."userId"
        JOIN "DriverProfile" dp ON dp.id = b."driverId"
        JOIN "User"   du       ON du.id = dp."userId"
        WHERE j.status IN ('MATCHED','PICKUP_EN_ROUTE','PICKUP_ARRIVED','LOADED','IN_TRANSIT','DELIVERED','COMPLETED')
      )
      SELECT
        *,
        GREATEST(1, distance_km * per_km_rate * required_tonnes) AS estimated_market,
        (bid_price::float / GREATEST(1, distance_km * per_km_rate * required_tonnes)) * 100 AS ratio_pct
      FROM job_with_bid
      WHERE (bid_price::float / GREATEST(1, distance_km * per_km_rate * required_tonnes)) * 100 < ${lowBidPct}
      ORDER BY created_at DESC
      OFFSET ${(query.page - 1) * query.limit}
      LIMIT ${query.limit}
    `;

    return reply.send({
      success: true,
      data: {
        jobs: rows.map((r) => ({
          id:              r.id,
          originAddress:   r.origin_address,
          destAddress:     r.dest_address,
          requiredTonnes:  Number(r.required_tonnes),
          askingPrice:     r.asking_price,
          bidPrice:        r.bid_price,
          currency:        r.currency,
          status:          r.status,
          createdAt:       r.created_at,
          shipperName:     r.shipper_name,
          driverName:      r.driver_name,
          distanceKm:      Number(r.distance_km),
          estimatedMarket: Math.round(Number(r.estimated_market)),
          ratioPct:        Math.round(Number(r.ratio_pct)),
        })),
        threshold: lowBidPct,
        page:  query.page,
        limit: query.limit,
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

}
