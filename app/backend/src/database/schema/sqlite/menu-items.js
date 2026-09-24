import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const menuItems = sqliteTable( "menu_items", {
  id: integer().primaryKey( { autoIncrement: true } ),
  name: text()
    .notNull(),
  priceCents: integer( "price_cents" )
    .notNull(),
  active: integer( "active", {
    mode: "boolean",
  } )
    .notNull()
    .default( true ),
  createdAt: integer( "created_at", {
    mode: "timestamp_ms",
  } )
    .notNull()
    .default( sql`(unixepoch() * 1000)` ),
} );
