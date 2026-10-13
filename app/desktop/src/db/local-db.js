const path = require("node:path");
const { eq, count } = require("drizzle-orm");

const DEFAULT_ADMIN_HASH =
  "f0203f893bca22dc40bcb1a8ce91ecfd:9e3b34b888a7ffa60d4288583a2f652c9df8d96ccd3ccd2cfffbedfaa233f3390497b0e2c5ebef8a90c1993b3f945b12a85e3fe4144bfa7422ba04d73a3f82f5"; // admin123 (scrypt)

const SEED_MENU_ITEMS = [
  { name: "Espresso", price_cents: 350, category: "Coffee" },
  { name: "Cappuccino", price_cents: 450, category: "Coffee" },
  { name: "Croissant", price_cents: 300, category: "Bakery" },
  { name: "Avocado Toast", price_cents: 850, category: "Food" },
  { name: "Club Sandwich", price_cents: 950, category: "Sandwiches" },
];

function seedDatabaseIfEmpty(db) {
  const { users, menuItems } = db.schema;

  const userRow = db.select({ count: count() }).from(users).get();
  const userCount = userRow ? userRow.count : 0;

  if (userCount === 0) {
    db.insert(users)
      .values({
        username: "admin",
        passwordHash: DEFAULT_ADMIN_HASH,
        role: "admin",
      })
      .run();
  } else {
    // Migrate legacy admin bcrypt hash to scrypt if present
    const admin = db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.username, "admin"))
      .get();

    if (admin && admin.passwordHash.startsWith("$2b$")) {
      db.update(users)
        .set({ passwordHash: DEFAULT_ADMIN_HASH })
        .where(eq(users.id, admin.id))
        .run();
    }
  }

  const menuRow = db.select({ count: count() }).from(menuItems).get();
  const menuCount = menuRow ? menuRow.count : 0;

  if (menuCount === 0) {
    for (const item of SEED_MENU_ITEMS) {
      db.insert(menuItems)
        .values({
          name: item.name,
          priceCents: item.price_cents,
          category: item.category || "Food",
        })
        .run();
    }
  }
}

function initLocalDatabase(backendSrcDir, dbPath) {
  const { openDatabase } = require(path.join(backendSrcDir, "database"));
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
