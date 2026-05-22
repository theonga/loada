import type { FastifyInstance } from "fastify";
import { handleDeliveryReport } from "@/lib/bulkit";

export async function smsRoutes(app: FastifyInstance) {
  app.post("/webhook", async (req, reply) => {
    const secret = req.headers["x-bulkit-secret"];
    if (process.env.BULKIT_WEBHOOK_SECRET && secret !== process.env.BULKIT_WEBHOOK_SECRET) {
      return reply.status(401).send({ success: false });
    }
    await handleDeliveryReport(req.body);
    return reply.send({ success: true });
  });
}
