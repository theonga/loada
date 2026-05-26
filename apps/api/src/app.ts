import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import * as Sentry from "@sentry/node";

import { authRoutes } from "@/routes/auth";
import { jobRoutes } from "@/routes/jobs";
import { bidRoutes } from "@/routes/bids";
import { deliveryRoutes } from "@/routes/deliveries";
import { messageRoutes } from "@/routes/messages";
import { subscriptionRoutes } from "@/routes/subscriptions";
import { ratingRoutes } from "@/routes/ratings";
import { driverRoutes } from "@/routes/drivers";
import { notificationRoutes } from "@/routes/notifications";
import { smsRoutes } from "@/routes/sms";
import { adminRoutes } from "@/routes/admin";
import { uploadRoutes } from "@/routes/uploads";
import { placesRoutes } from "@/routes/places";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
  }

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);
  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
    sign: { expiresIn: "15m" },
  });
  await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024 } });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });

  app.setErrorHandler((error, _req, reply) => {
    app.log.error(error);
    if (process.env.SENTRY_DSN) Sentry.captureException(error);
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: (error as { code?: string }).code ?? "INTERNAL_ERROR",
        message: (error as Error).message ?? "An unexpected error occurred",
      },
    });
  });

  await app.register(authRoutes, { prefix: "/v1/auth" });
  await app.register(jobRoutes, { prefix: "/v1/jobs" });
  await app.register(bidRoutes, { prefix: "/v1/bids" });
  await app.register(deliveryRoutes, { prefix: "/v1/deliveries" });
  await app.register(messageRoutes, { prefix: "/v1/messages" });
  await app.register(subscriptionRoutes, { prefix: "/v1/subscriptions" });
  await app.register(ratingRoutes, { prefix: "/v1/ratings" });
  await app.register(driverRoutes, { prefix: "/v1/drivers" });
  await app.register(notificationRoutes, { prefix: "/v1/notifications" });
  await app.register(smsRoutes, { prefix: "/v1/sms" });
  await app.register(adminRoutes, { prefix: "/v1/admin" });
  await app.register(uploadRoutes, { prefix: "/v1/uploads" });
  await app.register(placesRoutes, { prefix: "/v1/places" });

  app.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return app;
}
