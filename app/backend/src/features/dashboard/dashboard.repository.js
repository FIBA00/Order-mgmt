import { sql, and, gte, lte } from "drizzle-orm";

export function createDashboardRepository({ db, schema }) {
  const { orders } = schema;

  async function getTodayStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [result] = await db
      .select({
        orderCount: sql`count(*)`,
        revenueCents: sql`coalesce(sum(case when ${orders.status} = ${"paid"} then ${orders.totalCents} else 0 end), 0)`,
      })
      .from(orders)
      .where(
        and(gte(orders.createdAt, startOfDay), lte(orders.createdAt, endOfDay)),
      );

    return {
      orderCount: Number(result?.orderCount || 0),
      revenueCents: Number(result?.revenueCents || 0),
    };
  }

  return {
    getTodayStats,
  };
}
