const { pool, db } = require("./index");
const { users, menuItems } = require("./schema");
const { eq, count } = require("drizzle-orm");
const crypto = require("node:crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function migrate() {
  const client = await pool.connect();

  try {
    // Create tables if they don't exist.
    // In production swap this for drizzle-kit push/generate + proper migrations.
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           SERIAL PRIMARY KEY,
        username     TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role         TEXT NOT NULL DEFAULT 'cashier'
                       CHECK (role IN ('admin', 'cashier')),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id           SERIAL PRIMARY KEY,
        name         TEXT NOT NULL,
        price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),
        active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id),
        status       TEXT NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open', 'paid', 'cancelled')),
        total_cents  INTEGER NOT NULL CHECK (total_cents >= 0),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id               SERIAL PRIMARY KEY,
        order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id     INTEGER NOT NULL REFERENCES menu_items(id),
        quantity         INTEGER NOT NULL CHECK (quantity > 0),
        unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
      );
    `);

    // Seed admin user if no users exist
    const [{ value: userCount }] = await db.select({ value: count() }).from(users);
    if (Number(userCount) === 0) {
      await db.insert(users).values({
        username:     "admin",
        passwordHash: hashPassword("admin123"),
        role:         "admin"
      });
    }

    // Seed menu items if none exist
    const [{ value: menuCount }] = await db.select({ value: count() }).from(menuItems);
    if (Number(menuCount) === 0) {
      await db.insert(menuItems).values([
        { name: "Burger", priceCents: 850 },
        { name: "Pizza",  priceCents: 1200 },
        { name: "Coffee", priceCents: 300 }
      ]);
    }

    console.log("Migration complete");
  } finally {
    client.release();
  }
}

migrate().then(() => pool.end()).catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
