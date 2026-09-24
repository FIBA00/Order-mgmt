import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import process from "node:process";

// ! internal imports
import * as models from "./models.js";
import "../configs/env.config.js";

const DB_URL = process.env.DATABASE_URL;
const pool = new Pool( { connectionString: DB_URL } );
const database = drizzle( pool, { schema: models } );
export { DB_URL, database };
