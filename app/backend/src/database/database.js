import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

import path from "node:path";
import fs from "node:fs";

import "../configs/env.config.js";
import log from "../utils/logger.js";

import * as sqliteSchema from "./schema/sqlite/index.js";
import * as postgresSchema from "./schema/postgres/index.js";

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
  const filePath = DB_URL
    .replace( /^sqlite:/, "" )
    .replace( /^file:/, "" );

  const directory = path.dirname( filePath );

  if ( directory !== "." && !fs.existsSync( directory ) )
  {
    fs.mkdirSync( directory, { recursive: true } );
  }

  sqliteClient = new Database( filePath );
  schema = sqliteSchema;
  database = drizzleSqlite( sqliteClient, {
    schema,
  } );

  log.info( "Using SQLite database" );
} else
{
  pool = new Pool( {
    connectionString: DB_URL,
  } );
  schema = postgresSchema;
  database = drizzlePg( pool, {
    schema,
  } );

  log.info( "Using PostgreSQL database" );
}

export
{
  DB_URL,
  database,
  schema,
  isSqlite,
  pool,
  sqliteClient,
};
