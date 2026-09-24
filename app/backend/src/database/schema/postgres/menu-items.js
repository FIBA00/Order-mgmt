import { sql } from "drizzle-orm";
import
  {
    pgTable,
    integer,
    text,
    boolean,
  } from "drizzle-orm/pg-core";

export const menuItems = pgTable( "menu_items", {
  id: integer()
    .primaryKey()
    .generatedAlwaysAsIdentity(),
  name: text()
    .notNull(),
  priceCents: integer( "price_cents" )
    .notNull(),
  active: boolean()
    .notNull()
    .default( true ),
  createdAt: integer( "created_at" )
    .notNull()
    .default( sql`(extract(epoch from now()) * 1000)::bigint` ),
} );
