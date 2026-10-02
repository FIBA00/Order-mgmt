import { eq, desc, inArray } from "drizzle-orm";

export function createOrdersRepository({ db, schema }) {
  const { orders, orderItems, menuItems, users } = schema;

  async function findAll() {
    return db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
        username: users.username,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.id));
  }

  async function findById(id) {
    const [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
        username: users.username,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) return null;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        menuItemId: orderItems.menuItemId,
        name: menuItems.name,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, id));

    return { ...order, items };
  }

  async function findMenuItemsByIds(ids) {
    if (!ids || ids.length === 0) return [];
    return db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        active: menuItems.active,
      })
      .from(menuItems)
      .where(inArray(menuItems.id, ids));
  }

  async function create({ userId, totalCents, items, status = "open" }) {
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        status,
        totalCents,
        createdAt: new Date(),
      })
      .returning({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
      });

    if (items && items.length > 0) {
      await db.insert(orderItems).values(
        items.map((item) => ({
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        })),
      );
    }

    return order;
  }

  async function updateStatus(id, status) {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalCents: orders.totalCents,
        createdAt: orders.createdAt,
      });

    return order ?? null;
  }

  return {
    findAll,
    findById,
    findMenuItemsByIds,
    create,
    updateStatus,
  };
}
