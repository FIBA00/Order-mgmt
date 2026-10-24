import express from "express";
import cookieParser from "cookie-parser";
import RegisterRoutes from "../../src/routes/main.route.js";
import { generateToken } from "../../src/middlewares/auth.middleware.js";

export function createTestServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser("test-secret"));
  RegisterRoutes(app);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export function createTestToken(payload = {}) {
  return generateToken({
    id: payload.id ?? 1,
    username: payload.username ?? "admin",
    role: payload.role ?? "admin",
  });
}
