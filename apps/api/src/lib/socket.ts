import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { updateDriverLocation } from "@/services/location.service";

interface JwtPayload {
  userId: string;
  role: string;
}

interface AuthSocket extends Socket {
  userId?: string;
  driverProfileId?: string;
  shipperProfileId?: string;
}

const VIEWER_TTL_SECONDS = 60; // viewer presence expires if not refreshed

/**
 * Add a driver to a job's viewer set and broadcast the new count.
 * Idempotent — repeated calls just refresh the TTL.
 */
async function addJobViewer(jobsNs: ReturnType<Server["of"]>, jobId: string, driverProfileId: string): Promise<void> {
  const key = `loada:job:${jobId}:viewers`;
  await redis.zadd(key, Date.now(), driverProfileId);
  await redis.expire(key, VIEWER_TTL_SECONDS);
  await emitViewerCount(jobsNs, jobId);
}

async function removeJobViewer(jobsNs: ReturnType<Server["of"]>, jobId: string, driverProfileId: string): Promise<void> {
  await redis.zrem(`loada:job:${jobId}:viewers`, driverProfileId);
  await emitViewerCount(jobsNs, jobId);
}

async function emitViewerCount(jobsNs: ReturnType<Server["of"]>, jobId: string): Promise<void> {
  const key = `loada:job:${jobId}:viewers`;
  // Drop entries older than the TTL window
  await redis.zremrangebyscore(key, 0, Date.now() - VIEWER_TTL_SECONDS * 1000);
  const count = await redis.zcard(key);
  jobsNs.to(`job:${jobId}`).emit("job:viewer_count", { jobId, count });
}

// Shipper presence — drivers already publish isOnline on their profile via the
// online toggle, but shippers have no such concept in the data model. So we
// track shipper presence in Redis from socket lifecycle events on /jobs.
const SHIPPER_PRESENCE_KEY = "loada:presence:shippers";
const SHIPPER_PRESENCE_TTL_SECONDS = 60;

async function markShipperOnline(shipperProfileId: string): Promise<void> {
  await redis.zadd(SHIPPER_PRESENCE_KEY, Date.now(), shipperProfileId);
}

async function markShipperOffline(shipperProfileId: string): Promise<void> {
  await redis.zrem(SHIPPER_PRESENCE_KEY, shipperProfileId);
}

/**
 * Count online shippers (those who held a /jobs socket connection in the last
 * SHIPPER_PRESENCE_TTL_SECONDS window). Cleans up stale entries as it goes.
 * Exposed for the admin /stats endpoint.
 */
export async function getOnlineShipperCount(): Promise<number> {
  await redis.zremrangebyscore(SHIPPER_PRESENCE_KEY, 0, Date.now() - SHIPPER_PRESENCE_TTL_SECONDS * 1000);
  return redis.zcard(SHIPPER_PRESENCE_KEY);
}

async function authenticateSocket(socket: AuthSocket): Promise<boolean> {
  try {
    const token =
      (socket.handshake.auth as Record<string, string>)?.token ??
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) return false;

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    socket.userId = payload.userId;

    // Always look up both profiles when present — BOTH-role users can switch
    // their active view in-app, so the socket needs to track both IDs to route
    // events correctly without forcing a reconnect.
    const [driver, shipper] = await Promise.all([
      prisma.driverProfile.findUnique({ where: { userId: payload.userId }, select: { id: true } }),
      prisma.shipperProfile.findUnique({ where: { userId: payload.userId }, select: { id: true } }),
    ]);
    socket.driverProfileId = driver?.id;
    socket.shipperProfileId = shipper?.id;

    return true;
  } catch {
    return false;
  }
}

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const jobsNs = io.of("/jobs");
  const locationNs = io.of("/location");
  const chatNs = io.of("/chat");

  // ── /jobs — job lifecycle events ──────────────────────────────────────────
  jobsNs.on("connection", async (socket: AuthSocket) => {
    const ok = await authenticateSocket(socket);
    if (!ok) { socket.disconnect(true); return; }

    // Auto-join personal room so the server can target this driver directly
    // e.g. jobsNs.to(`driver:${driverProfileId}`).emit("job:new_load", ...)
    if (socket.driverProfileId) {
      socket.join(`driver:${socket.driverProfileId}`);
    }

    // Shippers don't carry an `isOnline` field in Postgres (unlike drivers), so
    // their presence is tracked via Redis on socket connect/disconnect for the
    // admin overview "online shippers" KPI.
    if (socket.shipperProfileId) {
      markShipperOnline(socket.shipperProfileId).catch(() => {});
    }

    // Track which jobs this socket is actively viewing so we can decrement
    // the viewer count on disconnect.
    const viewedJobs = new Set<string>();

    socket.on("job:subscribe", ({ jobId }: { jobId: string }) => {
      socket.join(`job:${jobId}`);
      // Sending the current viewer count to the just-joined socket so the
      // shipper sees a value immediately (otherwise they wait for the next
      // driver to join before getting their first emit).
      emitViewerCount(jobsNs, jobId).catch(() => {});
    });
    socket.on("job:unsubscribe", ({ jobId }: { jobId: string }) => socket.leave(`job:${jobId}`));

    // Driver opens the load-detail / bid screen → counted as viewing.
    // Heartbeat: drivers re-emit every ~30s to keep their presence alive.
    socket.on("job:view", ({ jobId }: { jobId: string }) => {
      if (!socket.driverProfileId || !jobId) return;
      viewedJobs.add(jobId);
      addJobViewer(jobsNs, jobId, socket.driverProfileId).catch(() => {});
    });

    socket.on("job:unview", ({ jobId }: { jobId: string }) => {
      if (!socket.driverProfileId || !jobId) return;
      viewedJobs.delete(jobId);
      removeJobViewer(jobsNs, jobId, socket.driverProfileId).catch(() => {});
    });

    socket.on("disconnect", () => {
      if (socket.shipperProfileId) {
        markShipperOffline(socket.shipperProfileId).catch(() => {});
      }
      if (!socket.driverProfileId) return;
      const driverId = socket.driverProfileId;
      for (const jobId of viewedJobs) {
        removeJobViewer(jobsNs, jobId, driverId).catch(() => {});
      }
    });
  });

  // ── /location — driver GPS updates ────────────────────────────────────────
  locationNs.on("connection", async (socket: AuthSocket) => {
    const ok = await authenticateSocket(socket);
    if (!ok) { socket.disconnect(true); return; }

    socket.on("location:update", (data: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
    }) => {
      const { lat, lng, heading, speed } = data;
      if (!socket.driverProfileId || typeof lat !== "number" || typeof lng !== "number") return;
      void updateDriverLocation(socket.driverProfileId, lat, lng, heading, speed);
    });

    // Subscribe to a job's location room (shippers tracking active delivery)
    socket.on("location:subscribe", ({ jobId }: { jobId: string }) => socket.join(`job:${jobId}`));
    socket.on("location:unsubscribe", ({ jobId }: { jobId: string }) => socket.leave(`job:${jobId}`));
  });

  // ── /chat — in-job messaging ───────────────────────────────────────────────
  // Messages are persisted via HTTP POST /v1/messages then broadcast here.
  // Clients only need to join/leave rooms; sending is via REST.
  chatNs.on("connection", async (socket: AuthSocket) => {
    const ok = await authenticateSocket(socket);
    if (!ok) { socket.disconnect(true); return; }

    socket.on("chat:subscribe", ({ jobId }: { jobId: string }) => socket.join(`job:${jobId}`));
    socket.on("chat:unsubscribe", ({ jobId }: { jobId: string }) => socket.leave(`job:${jobId}`));
  });

  return { io, jobsNs, locationNs, chatNs };
}

let _io: ReturnType<typeof createSocketServer> | null = null;

export const setSocketServer = (s: ReturnType<typeof createSocketServer>) => {
  _io = s;
};

export const getSocketServer = () => {
  if (!_io) throw new Error("Socket server not initialized");
  return _io;
};
