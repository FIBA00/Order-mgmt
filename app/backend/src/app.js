const express = require("express");
const { z } = require("zod");
const jwt = require("jsonwebtoken");

function createApp(services, {
  jwtSecret = "development-only-secret",
  corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173"
} = {}) {
  const app = express();
  app.use(express.json());

  // Minimal CORS for local web-mode dev (Vite on :5173 talking to Express on :4000).
  // Kept dependency-free on purpose; swap for the `cors` package if origins grow.
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  function authenticate(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Authentication required" });

    try {
      req.user = jwt.verify(token, jwtSecret);
      next();
    } catch {
      res.status(401).json({ error: "Invalid session" });
    }
  }

  function adminOnly(req, res, next) {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  }

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.post("/api/auth/login", (req, res) => {
    try {
      const input = z.object({
        username: z.string().min(1),
        password: z.string().min(1)
      }).parse(req.body);

      const user = services.auth.login(input.username, input.password);
      const token = jwt.sign(user, jwtSecret, { expiresIn: "8h" });

      res.json({ token, user });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  app.get("/api/menu", authenticate, (_req, res) => {
    res.json({ items: services.menu.list() });
  });

  app.post("/api/menu", authenticate, adminOnly, (req, res) => {
    try {
      const input = z.object({
        name: z.string().min(1),
        priceCents: z.number().int().nonnegative()
      }).parse(req.body);

      res.status(201).json({ item: services.menu.create(input.name, input.priceCents) });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/orders", authenticate, (_req, res) => {
    res.json({ orders: services.orders.list() });
  });

  app.post("/api/orders", authenticate, (req, res) => {
    try {
      const input = z.object({
        items: z.array(z.object({
          menuItemId: z.number().int(),
          quantity: z.number().int().positive()
        })).min(1)
      }).parse(req.body);

      res.status(201).json({
        order: services.orders.create(req.user.id, input.items)
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/orders/:id/status", authenticate, (req, res) => {
    try {
      services.orders.setStatus(
        Number(req.params.id),
        z.object({ status: z.enum(["open", "paid", "cancelled"]) }).parse(req.body).status
      );
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/dashboard", authenticate, (_req, res) => {
    res.json({ dashboard: services.dashboard.today() });
  });

  return app;
}

module.exports = { createApp };
