const express = require("express");
const { makeAuthMiddleware } = require("./middleware/auth");
const { errorHandler } = require("./middleware/errors");
const { createAuthRouter } = require("./features/auth/auth.router");
const { createMenuRouter } = require("./features/menu/menu.router");
const { createOrdersRouter } = require("./features/orders/orders.router");
const { createDashboardRouter } = require("./features/dashboard/dashboard.router");

function createApp(services, {
  jwtSecret  = "development-only-secret",
  corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173"
} = {}) {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  const { authenticate, adminOnly } = makeAuthMiddleware(jwtSecret);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth",      createAuthRouter(services.auth, jwtSecret, authenticate));
  app.use("/api/menu",      createMenuRouter(services.menu, authenticate, adminOnly));
  app.use("/api/orders",    createOrdersRouter(services.orders, authenticate));
  app.use("/api/dashboard", createDashboardRouter(services.dashboard, authenticate));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
