import "./src/configs/env.config.js";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/models.js",
  dialect: "sqlite",
  out: "./drizzle/sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL.replace(/^(sqlite:|file:)/, ""),
  },
});
