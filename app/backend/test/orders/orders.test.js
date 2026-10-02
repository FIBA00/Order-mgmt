import test from "node:test";
import assert from "node:assert/strict";
import { createTestServer, createTestToken } from "../helpers/test-server.js";

test("Orders Module", async (t) => {
  const { baseUrl, close } = createTestServer();

  t.after(async () => {
    await close();
  });

  const authToken = createTestToken({
    id: 1,
    username: "admin",
    role: "admin",
  });
  let createdOrderId = null;
  let testMenuItem = null;

  // Setup: fetch or create a menu item
  const menuRes = await fetch(`${baseUrl}/api/menu`);
  const menuBody = await menuRes.json();
  if (menuBody.data && menuBody.data.length > 0) {
    testMenuItem = menuBody.data[0];
  } else {
    const newMenuRes = await fetch(`${baseUrl}/api/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `OrderItem_${Date.now()}`,
        priceCents: 500,
      }),
    });
    const newMenuData = await newMenuRes.json();
    testMenuItem = newMenuData.data;
  }

  await t.test("rejects GET /api/orders without authentication", async () => {
    const res = await fetch(`${baseUrl}/api/orders`);
    assert.equal(res.status, 401);
  });

  await t.test("rejects POST /api/orders without authentication", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ menuItemId: testMenuItem.id, quantity: 1 }],
      }),
    });
    assert.equal(res.status, 401);
  });

  await t.test("rejects order with empty items array", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ items: [] }),
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects order with non-existent menu item", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        items: [{ menuItemId: 999999, quantity: 1 }],
      }),
    });
    assert.equal(res.status, 400);
  });

  await t.test("rejects order with invalid quantity", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        items: [{ menuItemId: testMenuItem.id, quantity: 0 }],
      }),
    });
    assert.equal(res.status, 400);
  });

  await t.test(
    "creates order with computed total and default open status",
    async () => {
      const quantity = 3;
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          items: [{ menuItemId: testMenuItem.id, quantity }],
        }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      const order = body.order || body.data;
      assert.equal(order.status, "open");
      assert.equal(order.totalCents, testMenuItem.priceCents * quantity);
      createdOrderId = order.id;
    },
  );

  await t.test("lists orders with user information", async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const ordersList = body.orders || body.data;
    assert.ok(Array.isArray(ordersList));
    assert.ok(ordersList.length > 0);
  });

  await t.test("retrieves single order details with nested items", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const order = body.order || body.data;
    assert.equal(order.id, createdOrderId);
    assert.ok(Array.isArray(order.items));
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].menuItemId, testMenuItem.id);
  });

  await t.test("updates order status to paid", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: "paid" }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const order = body.order || body.data;
    assert.equal(order.status, "paid");
  });

  await t.test("rejects invalid order status", async () => {
    const res = await fetch(`${baseUrl}/api/orders/${createdOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: "refunded_unsupported" }),
    });
    assert.equal(res.status, 400);
  });

  await t.test("returns 404 when updating non-existent order", async () => {
    const res = await fetch(`${baseUrl}/api/orders/999999/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    });
    assert.equal(res.status, 404);
  });
});
