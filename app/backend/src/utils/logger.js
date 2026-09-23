import pino from "pino";
import process from "node:process";
import "../configs/env.config.js";

const log = pino({
  name: process.env.APP_ID,
  level: process.env.LOG_LEVEL,
});
export default log;
