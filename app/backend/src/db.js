const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");

function openDatabase(filename) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });

  const db = new Database(filename);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrations = [
    {
      id: "001_initial",
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS menu_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('open', 'paid', 'cancelled')),
          total_cents INTEGER NOT NULL CHECK(total_cents >= 0),
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          menu_item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL CHECK(quantity > 0),
          unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents >= 0),
          FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY(menu_item_id) REFERENCES menu_items(id)
        );
      `
    }
  ];

  const applied = db.prepare("SELECT id FROM schema_migrations").all().map(row => row.id);

  for (const migration of migrations) {
    if (!applied.includes(migration.id)) {
      db.transaction(() => {
        db.exec(migration.sql);
        db.prepare("INSERT INTO schema_migrations (id) VALUES (?)").run(migration.id);
      })();
    }
  }

  return db;
}

module.exports = { openDatabase };
