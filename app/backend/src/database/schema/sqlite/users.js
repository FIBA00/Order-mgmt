import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer().primaryKey({ autoIncrement: true }),
  username: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text().notNull().default("cashier"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
