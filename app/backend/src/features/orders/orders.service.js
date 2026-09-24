const { eq, desc, and } = require("drizzle-orm");
const { orders, orderItems, menuItems, users } = require("../../db/schema");
const { createError } = require("../../middleware/errors");

function createOrdersService(db) {
  async function list() {
    return db
      .select({
        id: orders.id,
        status: orders.status,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
        username: users.username,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.id));
  }

  async function create(userId, items) {
    return db.transaction(async (tx) => {
      let totalCents = 0;
      const resolved = [];

      for (const item of items) {
        const [menu] = await tx
          .select({ id: menuItems.id, priceCents: menuItems.priceCents })
          .from(menuItems)
          .where(
            and(eq(menuItems.id, item.menuItemId), eq(menuItems.active, true)),
          )
          .limit(1);

        if (!menu)
          throw createError(
            `Menu item ${item.menuItemId} not found or inactive`,
            400,
          );

        totalCents += menu.priceCents * item.quantity;
        resolved.push({
          menuItemId: menu.id,
          quantity: item.quantity,
          unitPriceCents: menu.priceCents,
        });
      }

      const [order] = await tx
        .insert(orders)
        .values({ userId, status: "open", totalCents })
        .returning({
          id: orders.id,
          totalCents: orders.totalCents,
          status: orders.status,
        });

      await tx
        .insert(orderItems)
        .values(resolved.map((item) => ({ orderId: order.id, ...item })));

      return order;
    });
  }

  async function setStatus(id, status) {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning({ id: orders.id });

    if (!order) throw createError(`Order ${id} not found`, 404);
    return order;
  }

  return { list, create, setStatus };
}

module.exports = { createOrdersService };
