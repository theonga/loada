import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  const jobsNs = io.of("/jobs");
  const locationNs = io.of("/location");
  const chatNs = io.of("/chat");

  jobsNs.on("connection", (socket) => {
    socket.on("job:subscribe", ({ jobId }: { jobId: string }) => socket.join(`job:${jobId}`));
    socket.on("job:unsubscribe", ({ jobId }: { jobId: string }) => socket.leave(`job:${jobId}`));
  });

  locationNs.on("connection", (_socket) => {
    // location:update handled via location service
  });

  chatNs.on("connection", (_socket) => {
    // chat:send handled via message service
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
