import userRoute from "./users/users.route.js";


export default function RegisterRoutes ( app )
{
	app.use( "/api/user", userRoute )
	app.use( "/api/auth", createAuthRouter( services.auth, jwtSecret, authenticate ) );
	app.use( "/api/menu", createMenuRouter( services.menu, authenticate, adminOnly ) );
	app.use( "/api/orders", createOrdersRouter( services.orders, authenticate ) );
	app.use( "/api/dashboard", createDashboardRouter( services.dashboard, authenticate ) );
  
}