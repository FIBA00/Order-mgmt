import { sql, count } from "drizzle-orm";
import { sqliteSchema } from "../database/index.js";

export function createDashboardService(db) {
  const schema = db.schema || sqliteSchema;
  const { orders } = schema;

  return {
    today() {
      const row = db
        .select({
          orderCount: count(),
          revenueCents: sql`COALESCE(SUM(CASE WHEN ${orders.status} = 'paid' THEN ${orders.totalCents} ELSE 0 END), 0)`.mapWith(Number),
        })
        .from(orders)
        .where(
          sql`date(datetime(${orders.createdAt} / 1000, 'unixepoch', 'localtime')) = date('now', 'localtime') OR date(${orders.createdAt}, 'localtime') = date('now', 'localtime')`,
        )
        .get();

      return row || { orderCount: 0, revenueCents: 0 };
    },
  };
}
