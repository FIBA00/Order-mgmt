import process from "node:process";

// ! internal imports
import ExpressServer from "./src/server.js";
import RegisterRoutes from "./src/routes/main.route.js";
import "./src/configs/env.config.js";

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required");
  process.exit(1);
}

export default new ExpressServer()
  .router(RegisterRoutes)
  .listen(process.env.PORT);

// Graceful shutdown
process.on("SIGTERM", () => pool.end());
process.on("SIGINT", () => pool.end());
