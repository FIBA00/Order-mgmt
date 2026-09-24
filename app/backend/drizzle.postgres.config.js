import "./src/configs/env.config.js";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/database/models.js",
  dialect: "postgresql",
  out: "./drizzle/postgres",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
