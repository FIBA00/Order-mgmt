import { pgTable, integer, text } from "drizzle-orm/pg-core";
export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text().notNull().default("cashier"),
  createdAt: integer("created_at").notNull(),
});
