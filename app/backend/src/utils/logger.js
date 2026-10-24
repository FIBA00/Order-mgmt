import pino from "pino";
import process from "node:process";

import "../configs/env.config.js";

const isDevelopment = process.env.NODE_ENV !== "production";

const log = pino({
  name: process.env.APP_ID ?? "app",
  level: process.env.LOG_LEVEL ?? "info",

  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname,name",
        },
      }
    : undefined,
});

export default log;
