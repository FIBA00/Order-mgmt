/**
 * @file Unified Database Provider
 * @module @restaurant/backend/database
 *
 * Centralizes all database connections and lifecycle management using Drizzle ORM.
 * Provisions SQLite schemas via official Drizzle migrations with zero raw SQL queries.
 */

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";

// ── SQLite Schema Definitions ────────────────────────────────────────────────
import { users as sqliteUsers } from "./schema/sqlite/users.js";
import { menuItems as sqliteMenuItems } from "./schema/sqlite/menu-items.js";
import { orders as sqliteOrders } from "./schema/sqlite/orders.js";
import { orderItems as sqliteOrderItems } from "./schema/sqlite/orders-items.js";

// SQLite Schema Definitions export
export const sqliteSchema = {
  users: sqliteUsers,
  menuItems: sqliteMenuItems,
  orders: sqliteOrders,
  orderItems: sqliteOrderItems,
};

/**
 * Opens a local SQLite database instance using Drizzle ORM.
 * Automatically provisions tables via Drizzle schema migrations (zero raw SQL).
 *
 * @param {string} filename - Database file path on disk or ':memory:'
 * @param {object} [options={}] - Custom configuration options
 * @param {string} [options.migrationsFolder] - Custom migrations directory
 * @returns {import("drizzle-orm/better-sqlite3").BetterSQLite3Database}
 */
export function openDatabase(filename, options = {}) {
  const isMemory = filename === ":memory:";
  const resolvedPath = isMemory ? filename : path.resolve(filename);

  if (!isMemory) {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const sqlite = new Database(resolvedPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzleSqlite(sqlite, { schema: sqliteSchema });

  // Run Drizzle schema migrations (zero raw SQL)
  const migrationsFolder =
    options.migrationsFolder ||
    path.resolve(import.meta.dirname, "../../drizzle/sqlite");

  if (fs.existsSync(migrationsFolder)) {
    try {
      migrateSqlite(db, { migrationsFolder });
    } catch (err) {
      const isAlreadyExists =
        err.message?.includes("already exists") ||
        err.cause?.message?.includes("already exists");
      if (!isAlreadyExists) {
        throw err;
      }
    }
  }

  // Attach underlying client and lifecycle delegates for test and lifecycle management
  db.$client = sqlite;
  db.schema = sqliteSchema;
  db.close = sqlite.close.bind(sqlite);

  return db;
}

export default { openDatabase, sqliteSchema };
