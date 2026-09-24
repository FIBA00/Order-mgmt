import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

import path from "node:path";
import fs from "node:fs";

// ! Internal imports
import * as models from "./models.js";
import "../configs/env.config.js";
import log from "../utils/logger.js";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const DB_URL = process.env.DATABASE_URL;

if (!DB_URL) {
  throw new Error("[Database] DATABASE_URL is not defined.");
}

// --------------------------------------------------
// Database type
// --------------------------------------------------

const isSqlite =
  DB_URL.endsWith(".sqlite") ||
  DB_URL.endsWith(".db") ||
  DB_URL.startsWith("file:") ||
  DB_URL.startsWith("sqlite:");

// --------------------------------------------------
// Database instances
// --------------------------------------------------

let database;
let pool;
let sqliteClient;

// --------------------------------------------------
// SQLite
// --------------------------------------------------

if (isSqlite) {
  const filePath = DB_URL.replace(/^sqlite:/, "").replace(/^file:/, "");

  const directory = path.dirname(filePath);

  if (directory !== "." && !fs.existsSync(directory)) {
    log.info(`[Database] Creating SQLite directory: ${directory}`);

    fs.mkdirSync(directory, { recursive: true });
  }

  log.info(`[Database] Using SQLite: ${filePath}`);

  sqliteClient = new Database(filePath);

  database = drizzleSqlite(sqliteClient, {
    schema: models,
  });
}

// --------------------------------------------------
// PostgreSQL
// --------------------------------------------------

if (!isSqlite) {
  log.info("[Database] Using PostgreSQL");

  pool = new Pool({
    connectionString: DB_URL,
  });

  database = drizzlePg(pool, {
    schema: models,
  });
}

// --------------------------------------------------
// Connection check
// --------------------------------------------------

async function checkDatabaseConnection() {
  if (isSqlite) {
    try {
      sqliteClient.prepare("SELECT 1").get();

      log.info("[Database] SQLite connection OK");

      return true;
    } catch (error) {
      log.error("[Database] SQLite connection failed:", error);

      return false;
    }
  }

  if (!pool) {
    log.error("[Database] PostgreSQL pool is not initialized");

    return false;
  }

  try {
    const client = await pool.connect();

    try {
      await client.query("SELECT 1");

      log.info("[Database] PostgreSQL connection OK");

      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    log.error("[Database] PostgreSQL connection failed:", error);

    return false;
  }
}

// --------------------------------------------------
// Exports
// --------------------------------------------------

export {
  DB_URL,
  database,
  isSqlite,
  pool,
  sqliteClient,
  checkDatabaseConnection,
};
