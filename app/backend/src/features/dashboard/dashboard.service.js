const { sql, eq } = require("drizzle-orm");
const { orders } = require("../../db/schema");

function createDashboardService(db) {
  async function today() {
    // COUNT all orders today, SUM revenue only from paid ones
    const [result] = await db
      .select({
        orderCount:   sql`COUNT(*)::int`,
        revenueCents: sql`COALESCE(SUM(CASE WHEN ${orders.status} = 'paid' THEN ${orders.totalCents} ELSE 0 END), 0)::int`
      })
      .from(orders)
      .where(sql`${orders.createdAt}::date = CURRENT_DATE`);

    return result;
  }

  return { today };
}

module.exports = { createDashboardService };
