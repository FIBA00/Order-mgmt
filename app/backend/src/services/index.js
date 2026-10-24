/**
 * @file Application Domain Services Aggregator
 * @module @restaurant/backend/services
 *
 * Aggregates modular domain services (auth, menu, orders, dashboard)
 * with backward-compatible exports for Electron IPC and backend runners.
 */

import {
  createAuthService,
  verifyPassword,
  hashPasswordSync,
} from "./auth.service.js";
import { createMenuService } from "./menu.service.js";
import { createOrdersService } from "./orders.service.js";
import { createDashboardService } from "./dashboard.service.js";

export {
  createAuthService,
  verifyPassword,
  hashPasswordSync,
  createMenuService,
  createOrdersService,
  createDashboardService,
};

/**
 * Instantiates domain services on top of a Drizzle ORM database instance.
 *
 * @param {import("drizzle-orm/better-sqlite3").BetterSQLite3Database} db - Drizzle database instance
 * @returns {object} Domain services (auth, menu, orders, dashboard)
 */
export function createServices(db) {
  return {
    auth: createAuthService(db),
    menu: createMenuService(db),
    orders: createOrdersService(db),
    dashboard: createDashboardService(db),
  };
}

export default { createServices, verifyPassword, hashPasswordSync };
