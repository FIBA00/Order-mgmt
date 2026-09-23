const { db, pool } = require("./db");
const { createAuthService } = require("./features/auth/auth.service");
const { createMenuService } = require("./features/menu/menu.service");
const { createOrdersService } = require("./features/orders/orders.service");
const { createDashboardService } = require("./features/dashboard/dashboard.service");
const { createApp } = require("./app");

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required");
  process.exit(1);
}

const services = {
  auth:      createAuthService(db),
  menu:      createMenuService(db),
  orders:    createOrdersService(db),
  dashboard: createDashboardService(db)
};

const app = createApp(services, {
  jwtSecret: process.env.JWT_SECRET || "development-only-secret"
});

const port = Number(process.env.PORT || 4000);

app.listen(port, "127.0.0.1", () => {
  console.log(`Restaurant API: http://127.0.0.1:${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => pool.end());
process.on("SIGINT",  () => pool.end());
