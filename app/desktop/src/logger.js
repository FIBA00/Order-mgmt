const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const LOG_FILE = path.join(os.homedir(), ".restaurant-order-manager.log");

function appendLog(level, message, meta = "") {
  const timestamp = new Date().toISOString();
  let metaStr = "";
  if (meta instanceof Error) {
    metaStr = `\n${meta.stack || meta.message}`;
  } else if (meta && typeof meta === "object") {
    try {
      metaStr = ` ${JSON.stringify(meta)}`;
    } catch {
      metaStr = ` ${String(meta)}`;
    }
  } else if (meta) {
    metaStr = ` ${meta}`;
  }

  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch (err) {
    process.stderr.write(`Failed to write to log file: ${err.message}\n`);
  }
}

function initFileLogger(app) {
  // Rotate if log file is larger than 5MB
  try {
    if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > 5 * 1024 * 1024) {
      fs.renameSync(LOG_FILE, `${LOG_FILE}.old`);
    }
  } catch {}

  appendLog("INFO", "Application starting", {
    version: app?.getVersion ? app.getVersion() : "0.1.0",
    platform: process.platform,
    arch: process.arch,
    node: process.versions.node,
    electron: process.versions.electron
  });

  process.on("uncaughtException", err => {
    appendLog("FATAL", "Uncaught Exception in main process", err);
  });

  process.on("unhandledRejection", reason => {
    appendLog("ERROR", "Unhandled Promise Rejection in main process", reason);
  });

  process.on("exit", code => {
    appendLog("INFO", `Application exiting with code ${code}`);
  });

  // Mirror console calls to home directory log file
  const origError = console.error;
  const origWarn = console.warn;
  const origLog = console.log;

  console.error = (...args) => {
    appendLog(
      "ERROR",
      args
        .map(a => (a instanceof Error ? a.stack : typeof a === "object" ? JSON.stringify(a) : a))
        .join(" ")
    );
    origError.apply(console, args);
  };

  console.warn = (...args) => {
    appendLog(
      "WARN",
      args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")
    );
    origWarn.apply(console, args);
  };

  console.log = (...args) => {
    appendLog(
      "INFO",
      args.map(a => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")
    );
    origLog.apply(console, args);
  };

  return { LOG_FILE, appendLog };
}

module.exports = {
  LOG_FILE,
  appendLog,
  initFileLogger
};
