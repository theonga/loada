import "dotenv/config";
import { buildApp } from "./app";
import { createSocketServer, setSocketServer } from "./lib/socket";
import { startWorkers } from "./workers";

async function main() {
  const app = await buildApp();
  await app.ready();

  // Attach Socket.IO to Fastify's underlying http.Server before listen
  const socketServer = createSocketServer(app.server);
  setSocketServer(socketServer);

  startWorkers();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ port, host: "0.0.0.0" });
  console.info(`Loada API running on port ${port}`);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
