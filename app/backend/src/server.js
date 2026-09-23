import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import process from "node:process";
import bodyParser from "body-parser";
import os from "os";

// ! internal imports
import log from "./utils/logger.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

// env
const PORT = process.env.PORT || 8000;
const CLIENT = process.env.CLIENT_URL || "http://localhost:5173";
const REQUEST_LIMIT = process.env.REQUEST_LIMIT || "100kb";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "82w9eisfdjnweoisdfnmpe;asdjn";
const NODE_ENV = process.env.NODE_ENV || "local";

export default class ExpressServer {
  constructor() {
    app.use(express.json());
    app.use(function handleHeaders(req, res, next) {
      res.setHeader("Access-Control-Allow-Origin", CLIENT);
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
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
  }
  router(routes) {
    routes(app);
    app.use(errorHandler);
    return this;
  }

  listen(port = PORT) {
    app.listen(function logServer() {
      log.info(
        `App is up and running in ${NODE_ENV || "development"} @: ${os.hostname()} on port: ${port}`,
      );
    });
    return app;
  }
}
