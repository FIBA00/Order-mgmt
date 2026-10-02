const path = require("node:path");

const DEFAULT_ADMIN_HASH =
  "f0203f893bca22dc40bcb1a8ce91ecfd:9e3b34b888a7ffa60d4288583a2f652c9df8d96ccd3ccd2cfffbedfaa233f3390497b0e2c5ebef8a90c1993b3f945b12a85e3fe4144bfa7422ba04d73a3f82f5"; // admin123 (scrypt)

const SEED_MENU_ITEMS = [
  { name: "Espresso", price_cents: 350 },
  { name: "Cappuccino", price_cents: 450 },
  { name: "Croissant", price_cents: 300 },
  { name: "Avocado Toast", price_cents: 850 },
  { name: "Club Sandwich", price_cents: 950 },
];

function seedDatabaseIfEmpty(db) {
  const userCount = db
    .prepare("SELECT COUNT(*) AS count FROM users")
    .get().count;
  if (userCount === 0) {
    db.prepare(
      `
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, ?)
    `,
    ).run("admin", DEFAULT_ADMIN_HASH, "admin");
  } else {
    // Migrate legacy admin bcrypt hash to scrypt if present
    const admin = db
      .prepare("SELECT id, password_hash FROM users WHERE username = 'admin'")
      .get();
    if (admin && admin.password_hash.startsWith("$2b$")) {
      db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
        DEFAULT_ADMIN_HASH,
        admin.id,
      );
    }
  }

  const menuCount = db
    .prepare("SELECT COUNT(*) AS count FROM menu_items")
    .get().count;
  if (menuCount === 0) {
    const insert = db.prepare(
      "INSERT INTO menu_items (name, price_cents) VALUES (?, ?)",
    );
    for (const item of SEED_MENU_ITEMS) {
      insert.run(item.name, item.price_cents);
    }
  }
}

function initLocalDatabase(backendSrcDir, dbPath) {
  const { openDatabase } = require(path.join(backendSrcDir, "db"));
  const { createServices } = require(path.join(backendSrcDir, "services"));

  const db = openDatabase(dbPath);
  seedDatabaseIfEmpty(db);
  const services = createServices(db);

  return { db, services };
}

module.exports = {
  initLocalDatabase,
  seedDatabaseIfEmpty,
};
