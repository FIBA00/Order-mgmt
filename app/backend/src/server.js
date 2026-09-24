import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import process from "node:process";
import bodyParser from "body-parser";
import os from "os";
import morgan from "morgan"
// ! internal imports
import log from "./utils/logger.js";
import RegisterRoutes from "./routes/main.route.js";
import "./configs/env.config.js";

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required");
  process.exit(1);
}
// env
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

const CLIENT = process.env.CLIENT_URL || "http://localhost:5173";
const REQUEST_LIMIT = process.env.REQUEST_LIMIT || "100kb";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "82w9eisfdjnweoisdfnmpe;asdjn";
const NODE_ENV = process.env.NODE_ENV || "local";

const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

app.use(morgan("dev", "color"))
app.use(express.json());
app.use(function handleHeaders(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", CLIENT);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(
  cors({
    origin: CLIENT || "*",
    credentials: true,
  }),
);
app.use(
  bodyParser.json({
    limit: REQUEST_LIMIT || "100kb",
  }),
);
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: REQUEST_LIMIT || "100kb",
  }),
);
app.use(
  bodyParser.text({
    limit: REQUEST_LIMIT || "100kb",
  }),
);
app.use(cookieParser(SESSION_SECRET));

RegisterRoutes(app);
// registerAdminRoutes(app);

app.listen(PORT, HOST, () => {
  console.log(`Restaurant API: http://${HOST}:${PORT}`);
});
