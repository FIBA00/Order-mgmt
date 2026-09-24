import { DB_URL, isSqlite } from "./src/database/database.js";

const dialect = isSqlite ? "sqlite" : "postgresql";
const dbCredentials = isSqlite
  ? { url: DB_URL ? DB_URL.replace(/^(sqlite:|file:)/, "") : "" }
  : { url: DB_URL };

export default {
  schema: "./src/database/models.js",
  out: "./drizzle",
  dialect,
  dbCredentials,
};
