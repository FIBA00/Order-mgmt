import { DB_URL } from "./src/database/database.js";

export default {
  schema: "./src/database/models.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: DB_URL },
};
