// src/database/migrate.js

import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import { migrate as migratePostgres } from "drizzle-orm/node-postgres/migrator";

import { database, isSqlite } from "./database.js";

import log from "../utils/logger.js";
const migrationsFolder = isSqlite ? "./drizzle/sqlite" : "./drizzle/postgres";

async function main() {
  log.info("Running database migrations");

  try {
    if (isSqlite) {
      migrateSqlite(database, {
        migrationsFolder: migrationsFolder,
      });
    } else {
      await migratePostgres(database, {
        migrationsFolder: migrationsFolder,
      });
    }

    log.info("Database migrations completed");
  } catch (error) {
    console.error(error);

    log.error({ error }, "Database migrations failed");
    process.exitCode = 1;
  }
}

await main();
