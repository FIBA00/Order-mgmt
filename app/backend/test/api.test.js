// These tests run against a real Postgres database.
// Set TEST_DATABASE_URL before running:
//   TEST_DATABASE_URL=postgres://localhost/restaurant_test node --test
//
// The test database is wiped and re-migrated before each test.

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "test-secret";

async function buildTestApp() {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  // Fresh require so each test file gets a fresh pool
  const { db, pool } = require("./src/db");
  const { createAuthService } = require("./src/features/auth/auth.service");
  const { createMenuService } = require("./src/features/menu/menu.service");
  const {
    createOrdersService,
  } = require("./src/features/orders/orders.service");
  const {
    createDashboardService,
  } = require("./src/features/dashboard/dashboard.service");
  const { createApp } = require("./src/app");
  const { users, menuItems } = require("./src/db/schema");
  const crypto = require("node:crypto");

  function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
  }

  // Wipe and re-seed for isolation
  await pool.query(`
    DROP TABLE IF EXISTS order_items, orders, menu_items, users CASCADE;
    CREATE TABLE users (
      id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin','cashier')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE menu_items (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE orders (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','cancelled')),
      total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0)
    );
  `);

  await db.insert(users).values([
    {
      username: "admin",
      passwordHash: hashPassword("admin123"),
      role: "admin",
    },
    {
      username: "cashier",
      passwordHash: hashPassword("cashier123"),
      role: "cashier",
    },
  ]);
  await db.insert(menuItems).values([{ name: "Burger", priceCents: 850 }]);

  const services = {
    auth: createAuthService(db),
    menu: createMenuService(db),
    orders: createOrdersService(db),
    dashboard: createDashboardService(db),
  };

  const app = createApp(services, { jwtSecret: JWT_SECRET });
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  function tokenFor(role, id = 999) {
    return jwt.sign({ id, username: `${role}-test`, role }, JWT_SECRET, {
      expiresIn: "1h",
    });
  }

  return {
    baseUrl,
    tokenFor,
    close: () => new Promise((r) => server.close(r)).then(() => pool.end()),
  };
}

test("rejects login with wrong password", async () => {
  const { baseUrl, close } = await buildTestApp();
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong" }),
    });
    assert.equal(res.status, 401);
  } finally {
    await close();
  }
});

test("rejects requests with no token", async () => {
  const { baseUrl, close } = await buildTestApp();
  try {
    const res = await fetch(`${baseUrl}/api/menu`);
    assert.equal(res.status, 401);
  } finally {
    await close();
  }
});

test("rejects a cashier creating a menu item (adminOnly)", async () => {
  const { baseUrl, tokenFor, close } = await buildTestApp();
  try {
    const res = await fetch(`${baseUrl}/api/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("cashier")}`,
      },
      body: JSON.stringify({ name: "Fries", priceCents: 400 }),
    });
    assert.equal(res.status, 403);
  } finally {
    await close();
  }
});

test("allows an admin to create a menu item", async () => {
  const { baseUrl, tokenFor, close } = await buildTestApp();
  try {
    const res = await fetch(`${baseUrl}/api/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("admin")}`,
      },
      body: JSON.stringify({ name: "Fries", priceCents: 400 }),
    });
    assert.equal(res.status, 201);
    const { item } = await res.json();
    assert.equal(item.name, "Fries");
  } finally {
    await close();
  }
});

test("creates an order and computes total from menu prices server-side", async () => {
  const { baseUrl, tokenFor, close } = await buildTestApp();
  try {
    // Get the seeded burger's id
    const menuRes = await fetch(`${baseUrl}/api/menu`, {
      headers: { Authorization: `Bearer ${tokenFor("cashier")}` },
    });
    const { items } = await menuRes.json();
    const burger = items[0];

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("cashier", 1)}`,
      },
      body: JSON.stringify({ items: [{ menuItemId: burger.id, quantity: 2 }] }),
    });
    assert.equal(res.status, 201);
    const { order } = await res.json();
    assert.equal(order.totalCents, 850 * 2);
  } finally {
    await close();
  }
});

test("rejects an order referencing a non-existent menu item", async () => {
  const { baseUrl, tokenFor, close } = await buildTestApp();
  try {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("cashier")}`,
      },
      body: JSON.stringify({ items: [{ menuItemId: 999999, quantity: 1 }] }),
    });
    assert.equal(res.status, 400);
  } finally {
    await close();
  }
});

test("rejects an invalid order status", async () => {
  const { baseUrl, tokenFor, close } = await buildTestApp();
  try {
    const res = await fetch(`${baseUrl}/api/orders/1/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("cashier")}`,
      },
      body: JSON.stringify({ status: "refunded" }),
    });
    assert.equal(res.status, 400);
  } finally {
    await close();
  }
});
