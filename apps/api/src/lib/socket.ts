import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { updateDriverLocation } from "@/services/location.service";

interface JwtPayload {
  userId: string;
  role: string;
}

interface AuthSocket extends Socket {
  userId?: string;
  driverProfileId?: string;
}

async function authenticateSocket(socket: AuthSocket): Promise<boolean> {
  try {
    const token =
      (socket.handshake.auth as Record<string, string>)?.token ??
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) return false;

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    socket.userId = payload.userId;

    if (payload.role === "DRIVER" || payload.role === "BOTH") {
      const profile = await prisma.driverProfile.findUnique({
        where: { userId: payload.userId },
        select: { id: true },
      });
      socket.driverProfileId = profile?.id;
    }

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

    socket.on("job:subscribe", ({ jobId }: { jobId: string }) => socket.join(`job:${jobId}`));
    socket.on("job:unsubscribe", ({ jobId }: { jobId: string }) => socket.leave(`job:${jobId}`));
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
