import { defineConfig } from "drizzle-kit";
import process from "node:process";
import "./src/configs/env.config.js";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/database/schema/sqlite",
  out: "./drizzle/sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL.replace(/^sqlite:/, "").replace(/^file:/, ""),
  },
});
