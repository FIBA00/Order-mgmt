import { defineConfig } from "drizzle-kit";
import process from "node:process";
import "./src/configs/env.config.js";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schema/postgres",
  out: "./drizzle/postgres",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
