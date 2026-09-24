import { sql } from "drizzle-orm";
import { pgTable, integer, text } from "drizzle-orm/pg-core";
import { users } from "./users.js";
export const orders = pgTable("orders", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  status: text().notNull().default("open"),
  totalCents: integer("total_cents").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(sql`(extract(epoch from now()) * 1000)::integer`),
});
