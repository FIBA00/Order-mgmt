import authRouter from "../features/auth/auth.router.js";
import menuRouter from "../features/menu/menu.router.js";
import ordersRouter from "../features/orders/orders.router.js";
import dashboardRouter from "../features/dashboard/dashboard.router.js";

export default function RegisterRoutes(app) {
  app.use("/api/auth", authRouter);
  app.use("/api/menu", menuRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/dashboard", dashboardRouter);
}
