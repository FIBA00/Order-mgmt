const path = require("node:path");
const { openDatabase } = require("./db");
const { createServices } = require("./services");
const { createApp } = require("./app");

const port = Number(process.env.PORT || 4000);
const databasePath = process.env.DATABASE_URL
  ? path.resolve(process.env.DATABASE_URL)
  : path.resolve(__dirname, "../data/app.sqlite");

const db = openDatabase(databasePath);
const services = createServices(db);
const app = createApp(services, {
  jwtSecret: process.env.JWT_SECRET || "development-only-secret"
});

app.listen(port, "127.0.0.1", () => {
  console.log(`Restaurant API: http://127.0.0.1:${port}`);
});
