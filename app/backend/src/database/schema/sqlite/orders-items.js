import { sqliteTable, integer } from "drizzle-orm/sqlite-core";
import { orders } from "./orders.js";
import { menuItems } from "./menu-items.js";
export const orderItems = sqliteTable("order_items", {
  id: integer().primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id),
  quantity: integer().notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
});
