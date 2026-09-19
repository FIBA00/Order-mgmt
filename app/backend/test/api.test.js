const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const jwt = require("jsonwebtoken");
const { openDatabase } = require("../src/db");
const { createServices } = require("../src/services");
const { createApp } = require("../src/app");

const JWT_SECRET = "test-secret";

function startServer() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "restaurant-api-test-"));
  const db = openDatabase(path.join(dir, "test.sqlite"));
  const services = createServices(db);
  const app = createApp(services, { jwtSecret: JWT_SECRET });
  const server = app.listen(0);
  const port = server.address().port;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve)),
    db
  };
}

// Signs a token directly rather than logging in, so we can exercise
// adminOnly with a role that isn't seeded by default (there's currently no
// code path that creates a cashier user). This also demonstrates a real
// property of the auth model worth knowing: role is trusted from the JWT
// payload for the life of the token (up to 8h) and never re-checked
// against the database on each request.
function tokenFor(role, id = 999) {
  return jwt.sign({ id, username: `${role}-test`, role }, JWT_SECRET, { expiresIn: "1h" });
}

test("rejects login with wrong password", async () => {
  const { baseUrl, close } = startServer();
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrong" })
    });
    assert.equal(res.status, 401);
  } finally {
    await close();
  }
});

test("rejects requests with no token", async () => {
  const { baseUrl, close } = startServer();
  try {
    const res = await fetch(`${baseUrl}/api/menu`);
    assert.equal(res.status, 401);
  } finally {
    await close();
  }
});

test("rejects a cashier creating a menu item (adminOnly)", async () => {
  const { baseUrl, close } = startServer();
  try {
    const res = await fetch(`${baseUrl}/api/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("cashier")}`
      },
      body: JSON.stringify({ name: "Fries", priceCents: 400 })
    });
    assert.equal(res.status, 403);
  } finally {
    await close();
  }
});

test("allows an admin to create a menu item", async () => {
  const { baseUrl, close } = startServer();
  try {
    const res = await fetch(`${baseUrl}/api/menu`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("admin")}`
      },
      body: JSON.stringify({ name: "Fries", priceCents: 400 })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.item.name, "Fries");
  } finally {
    await close();
  }
});

test("rejects an order referencing a menu item that does not exist", async () => {
  const { baseUrl, close } = startServer();
  try {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("cashier")}`
      },
      body: JSON.stringify({ items: [{ menuItemId: 999999, quantity: 1 }] })
    });
    assert.equal(res.status, 400);
  } finally {
    await close();
  }
});

test("rejects an invalid order status transition", async () => {
  const { baseUrl, close } = startServer();
  try {
    const res = await fetch(`${baseUrl}/api/orders/1/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenFor("cashier")}`
      },
      body: JSON.stringify({ status: "refunded" })
    });
    assert.equal(res.status, 400);
  } finally {
    await close();
  }
});
