const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { initLocalDatabase, seedDatabaseIfEmpty } = require("../src/db/local-db.js");
const { getBackendSrcDir } = require("../src/config/app.config.js");

test("Desktop Local Database & Auto-Seeder Module", async t => {
  const backendSrcDir = getBackendSrcDir(false);
  const testDbDir = path.join("/tmp", `desktop-db-test-${Date.now()}`);
  const testDbPath = path.join(testDbDir, "test.sqlite");

  t.after(() => {
    try {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  let db = null;
  let services = null;

  await t.test("initializes local SQLite database and seeds default data", () => {
    const initialized = initLocalDatabase(backendSrcDir, testDbPath);
    db = initialized.db;
    services = initialized.services;

    assert.ok(db, "db instance should be returned");
    assert.ok(services, "services instance should be returned");
    assert.ok(fs.existsSync(testDbPath), "database file must exist on disk");

    // Check seeded admin user
    const users = db.prepare("SELECT * FROM users").all();
    assert.equal(users.length, 1);
    assert.equal(users[0].username, "admin");
    assert.equal(users[0].role, "admin");

    // Check seeded menu items
    const menuItems = db.prepare("SELECT * FROM menu_items").all();
    assert.equal(menuItems.length, 5);
    const names = menuItems.map(m => m.name);
    assert.ok(names.includes("Espresso"));
    assert.ok(names.includes("Cappuccino"));
  });

  await t.test("is idempotent and does not duplicate seeds on second run", () => {
    seedDatabaseIfEmpty(db);

    const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
    const menuCount = db.prepare("SELECT COUNT(*) AS count FROM menu_items").get().count;

    assert.equal(userCount, 1);
    assert.equal(menuCount, 5);
  });

  await t.test("authenticates seeded admin user via services.auth.login", () => {
    const user = services.auth.login("admin", "admin123");
    assert.ok(user);
    assert.equal(user.username, "admin");
    assert.equal(user.role, "admin");
  });

  await t.test("retrieves menu items through services.menu.list", () => {
    const list = services.menu.list();
    assert.ok(Array.isArray(list));
    assert.equal(list.length, 5);
  });

  await t.test("creates order and updates dashboard metrics through services", () => {
    const menu = services.menu.list();
    const item = menu[0];

    const order = services.orders.create(1, [{ menuItemId: item.id, quantity: 2 }]);
    assert.ok(order);
    assert.equal(order.status, "open");
    assert.equal(order.totalCents, item.priceCents * 2);

    // Initial dashboard: open order counted, 0 paid revenue
    const initialDash = services.dashboard.today();
    assert.equal(initialDash.orderCount, 1);
    assert.equal(initialDash.revenueCents, 0);

    // Mark paid
    services.orders.setStatus(order.id, "paid");
    const updatedDash = services.dashboard.today();
    assert.equal(updatedDash.orderCount, 1);
    assert.equal(updatedDash.revenueCents, item.priceCents * 2);

    db.close();
  });
});
