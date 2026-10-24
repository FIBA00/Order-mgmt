import { eq, desc, and, inArray } from "drizzle-orm";
import { sqliteSchema } from "../database/index.js";

export function createOrdersService(db) {
  const schema = db.schema || sqliteSchema;
  const { users, menuItems, orders, orderItems } = schema;

  return {
    list() {
      const orderRows = db
        .select({
          id: orders.id,
          status: orders.status,
          totalCents: orders.totalCents,
          createdAt: orders.createdAt,
          username: users.username,
        })
        .from(orders)
        .innerJoin(users, eq(users.id, orders.userId))
        .orderBy(desc(orders.id))
        .all();

      if (!orderRows.length) return [];

      const orderIds = orderRows.map((o) => o.id);
      const itemRows = db
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
        .where(inArray(orderItems.orderId, orderIds))
        .all();

      const itemsByOrder = new Map();
      for (const item of itemRows) {
        if (!itemsByOrder.has(item.orderId)) {
          itemsByOrder.set(item.orderId, []);
        }
        itemsByOrder.get(item.orderId).push(item);
      }

      return orderRows.map((o) => ({
        ...o,
        items: itemsByOrder.get(o.id) || [],
      }));
    },

    get(id) {
      const order = db
        .select({
          id: orders.id,
          status: orders.status,
          totalCents: orders.totalCents,
          createdAt: orders.createdAt,
          username: users.username,
        })
        .from(orders)
        .innerJoin(users, eq(users.id, orders.userId))
        .where(eq(orders.id, id))
        .get();

      if (!order) return null;

      const items = db
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
        .where(eq(orderItems.orderId, id))
        .all();

      return { ...order, items };
    },

    create(userId, items) {
      const executeCreate = (tx) => {
        const client = tx || db;
        let total = 0;
        const resolved = [];

        for (const item of items) {
          const menu = client
            .select({
              id: menuItems.id,
              priceCents: menuItems.priceCents,
            })
            .from(menuItems)
            .where(and(eq(menuItems.id, item.menuItemId), eq(menuItems.active, true)))
            .get();

          if (!menu) {
            throw new Error(`Menu item ${item.menuItemId} not found`);
          }
          if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            throw new Error("Quantity must be a positive integer");
          }
          total += menu.priceCents * item.quantity;
          resolved.push({ ...item, priceCents: menu.priceCents });
        }

        const [order] = client
          .insert(orders)
          .values({
            userId,
            status: "open",
            totalCents: total,
          })
          .returning({ id: orders.id })
          .all();

        for (const item of resolved) {
          client
            .insert(orderItems)
            .values({
              orderId: order.id,
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              unitPriceCents: item.priceCents,
            })
            .run();
        }

        return {
          id: order.id,
          totalCents: total,
          status: "open",
        };
      };

      if (typeof db.transaction === "function") {
        return db.transaction((tx) => executeCreate(tx));
      }
      return executeCreate(db);
    },

    setStatus(id, status) {
      if (!["open", "paid", "cancelled"].includes(status)) {
        throw new Error("Invalid order status");
      }
      return db
        .update(orders)
        .set({ status })
        .where(eq(orders.id, id))
        .run();
    },
  };
}
