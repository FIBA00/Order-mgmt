const { pgTable, serial, text, integer, timestamp, boolean } = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id:           serial("id").primaryKey(),
  username:     text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role:         text("role").notNull().default("cashier"),
  createdAt:    timestamp("created_at").notNull().defaultNow()
});

const menuItems = pgTable("menu_items", {
  id:         serial("id").primaryKey(),
  name:       text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  active:     boolean("active").notNull().default(true),
  createdAt:  timestamp("created_at").notNull().defaultNow()
});

const orders = pgTable("orders", {
  id:         serial("id").primaryKey(),
  userId:     integer("user_id").notNull().references(() => users.id),
  status:     text("status").notNull().default("open"),
  totalCents: integer("total_cents").notNull(),
  createdAt:  timestamp("created_at").notNull().defaultNow()
});

const orderItems = pgTable("order_items", {
  id:            serial("id").primaryKey(),
  orderId:       integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  menuItemId:    integer("menu_item_id").notNull().references(() => menuItems.id),
  quantity:      integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull()
});

module.exports = { users, menuItems, orders, orderItems };
