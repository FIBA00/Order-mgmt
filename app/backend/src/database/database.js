import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import process from "node:process";
import path from "node:path";
import fs from "node:fs";

// ! internal imports
import * as models from "./models.js";
import "../configs/env.config.js";

const DB_URL = process.env.DATABASE_URL;

let database;
let pool;

const isSqlite =
  Boolean(DB_URL) &&
  (DB_URL.endsWith(".sqlite") ||
    DB_URL.endsWith(".db") ||
    DB_URL.startsWith("file:") ||
    DB_URL.startsWith("sqlite:"));

if (isSqlite) {
  const { drizzle: drizzleSqlite } = await import("drizzle-orm/better-sqlite3");
  const { default: Database } = await import("better-sqlite3");
  const filePath = DB_URL.replace(/^sqlite:/, "").replace(/^file:/, "");
  const dir = path.dirname(filePath);
  if (dir && dir !== "." && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const sqliteClient = new Database(filePath);
  database = drizzleSqlite(sqliteClient, { schema: models });
} else {
  pool = new Pool({ connectionString: DB_URL });
  database = drizzlePg(pool, { schema: models });
}

export { DB_URL, database, isSqlite, pool };
