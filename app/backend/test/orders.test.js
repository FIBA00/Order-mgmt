const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { openDatabase } = require("../src/db");
const { createServices } = require("../src/services");

test("creates an order using prices from the database", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "restaurant-test-"));
  const db = openDatabase(path.join(dir, "test.sqlite"));
  const services = createServices(db);

  const user = services.auth.login("admin", "admin123");
  const menu = services.menu.list();

  const order = services.orders.create(user.id, [
    { menuItemId: menu[0].id, quantity: 2 }
  ]);

  assert.equal(order.totalCents, menu[0].priceCents * 2);
  db.close();
});
