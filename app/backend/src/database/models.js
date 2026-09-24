import { sql } from "drizzle-orm";

import
  {
    sqliteTable,
    integer as sqliteInteger,
    text as sqliteText,
  } from "drizzle-orm/sqlite-core";

import
  {
    pgTable,
    integer as pgInteger,
    text as pgText,
    boolean as pgBoolean,
  } from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────
// Schema factory
// ─────────────────────────────────────────────

function createSchema ( { table, integer, text, boolean, id, createdAt } )
{
  const users = table( "users", {
    id: id(),
    username: text().notNull().unique(),
    passwordHash: text( "password_hash" ).notNull(),
    role: text().notNull().default( "cashier" ),
    createdAt: createdAt(),
  } );

  const menuItems = table( "menu_items", {
    id: id(),
    name: text().notNull(),
    priceCents: integer( "price_cents" ).notNull(),
    active: boolean().notNull().default( true ),
    createdAt: createdAt(),
  } );

  const orders = table( "orders", {
    id: id(),
    userId: integer( "user_id" )
      .notNull()
      .references( () => users.id ),
    status: text().notNull().default( "open" ),
    totalCents: integer( "total_cents" ).notNull(),
    createdAt: createdAt(),
  } );

  const orderItems = table( "order_items", {
    id: id(),
    orderId: integer( "order_id" )
      .notNull()
      .references( () => orders.id, {
        onDelete: "cascade",
      } ),
    menuItemId: integer( "menu_item_id" )
      .notNull()
      .references( () => menuItems.id ),
    quantity: integer().notNull(),
    unitPriceCents: integer( "unit_price_cents" ).notNull(),
  } );

  return {
    users,
    menuItems,
    orders,
    orderItems,
  };
}

// ─────────────────────────────────────────────
// SQLite schema
// ─────────────────────────────────────────────

export const sqliteSchema = createSchema( {
  table: sqliteTable,
  integer: sqliteInteger,
  text: sqliteText,
  boolean: () =>
    sqliteInteger( {
      mode: "boolean",
    } ),
  id: () =>
    sqliteInteger().primaryKey( {
      autoIncrement: true,
    } ),
  createdAt: () =>
    sqliteInteger( "created_at" )
      .notNull()
      .default( sql`(unixepoch())` ),
} );

// ─────────────────────────────────────────────
// PostgreSQL schema
// ─────────────────────────────────────────────

export const postgresSchema = createSchema( {
  table: pgTable,
  integer: pgInteger,
  text: pgText,
  boolean: pgBoolean,

  id: () => pgInteger().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: () =>
    pgInteger( "created_at" )
      .notNull()
      .default( sql`extract(epoch from now())` ),
} );

// ─────────────────────────────────────────────
// Runtime schema selection
// ─────────────────────────────────────────────

export function getSchema ( isSqlite )
{
  return isSqlite ? sqliteSchema : postgresSchema;
}

// Default export for convenience
export default sqliteSchema;
