import "dotenv/config";
import { buildApp } from "./app";
import { createSocketServer, setSocketServer } from "./lib/socket";
import { startWorkers } from "./workers";
import { sweepExpiredBiddingSessions } from "./services/matching.service";

const SWEEP_INTERVAL_MS = 60_000;

async function main() {
  const app = await buildApp();
  await app.ready();

  // Attach Socket.IO to Fastify's underlying http.Server before listen
  const socketServer = createSocketServer(app.server);
  setSocketServer(socketServer);

  startWorkers();

  // Startup sweep — catches any bidding sessions that became overdue while the
  // API was down (BullMQ delayed tasks can be lost on Redis flushes or worker
  // outages, leaving jobs stuck in POSTED with the wrong status).
  sweepExpiredBiddingSessions()
    .then((n) => { if (n > 0) console.info(`[startup-sweep] Expired ${n} stale bidding session(s)`); })
    .catch((err) => console.error("[startup-sweep] failed", err));

  // Periodic sweep — backstop for any delayed task that gets lost in flight.
  setInterval(() => {
    sweepExpiredBiddingSessions()
      .then((n) => { if (n > 0) console.info(`[periodic-sweep] Expired ${n} bidding session(s)`); })
      .catch((err) => console.error("[periodic-sweep] failed", err));
  }, SWEEP_INTERVAL_MS).unref();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ port, host: "0.0.0.0" });
  console.info(`Loada API running on port ${port}`);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
