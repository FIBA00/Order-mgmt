import process from "node:process";
import path from "node:path";
import fs from "node:fs";

// dep imports
import Database from "better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";

// ! internal imports
import "../configs/env.config.js";
import log from "../utils/logger.js";

// # sqlite schemas
import { users as sqliteUsers } from "./schema/sqlite/users.js";
import { orders as sqliteOrders } from "./schema/sqlite/orders.js";
import { menuItems as sqliteMenuItems } from "./schema/sqlite/menu-items.js";
import { orderItems as sqliteOrderItems } from "./schema/sqlite/order-items.js";

// # postgres schemas
import { users as postgresUsers } from "./schema/postgres/users.js";
import { orders as postgresOrders } from "./schema/postgres/orders.js";
import { menuItems as postgresMenuItems } from "./schema/postgres/menu-items.js";
import { orderItems as postgresOrderItems } from "./schema/postgres/order-items.js";


const DB_URL = process.env.DATABASE_URL;
if ( !DB_URL )
{
  throw new Error( "DATABASE_URL is not defined" );
}
const isSqlite =
  DB_URL.endsWith( ".sqlite" ) ||
  DB_URL.endsWith( ".db" ) ||
  DB_URL.startsWith( "file:" ) ||
  DB_URL.startsWith( "sqlite:" );

let database;
let pool;
let sqliteClient;
let schema;

if ( isSqlite )
{
  const filePath = DB_URL.replace( /^sqlite:/, "" ).replace( /^file:/, "" );
  const directory = path.dirname( filePath );
  if ( directory !== "." && !fs.existsSync( directory ) )
  {
    fs.mkdirSync( directory, { recursive: true } );
  }
  sqliteClient = new Database( filePath );
  schema = {
    users: sqliteUsers,
    menuItems: sqliteMenuItems,
    orders: sqliteOrders,
    orderItems: sqliteOrderItems,
  };
  database = drizzleSqlite( sqliteClient, { schema } );
  log.info( "Using SQLite database" );
} else
{
  pool = new Pool( { connectionString: DB_URL } );
  schema = {
    users: postgresUsers,
    menuItems: postgresMenuItems,
    orders: postgresOrders,
    orderItems: postgresOrderItems,
  };
  database = drizzlePg( pool, { schema } );
  log.info( "Using PostgreSQL database" );
}
export { database, schema, DB_URL, isSqlite, pool, sqliteClient };
