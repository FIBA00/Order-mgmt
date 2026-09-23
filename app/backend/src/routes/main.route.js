import menuRoute from "../features/menu/menu.router.js";
import authRoute from "../features/auth/auth.router.js";

// import userRoute from "./users/users.route.js";

export default function RegisterRoutes(app) {
  app.use( "/api/auth", authRoute );
  app.use( "/api/menu", menuRoute );

  // app.use( "/api/user", userRoute )
  // app.use( "/api/orders", createOrdersRouter( services.orders, authenticate ) );
  // app.use( "/api/dashboard", createDashboardRouter( services.dashboard, authenticate ) );
}
