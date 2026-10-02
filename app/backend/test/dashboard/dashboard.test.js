import test from "node:test";
import assert from "node:assert/strict";
import { createTestServer, createTestToken } from "../helpers/test-server.js";

test("Dashboard Module", async (t) => {
  const { baseUrl, close } = createTestServer();

  t.after(async () => {
    await close();
  });

  const authToken = createTestToken({
    id: 1,
    username: "admin",
    role: "admin",
  });

  await t.test("rejects GET /api/dashboard without auth", async () => {
    const res = await fetch(`${baseUrl}/api/dashboard`);
    assert.equal(res.status, 401);
  });

  await t.test("retrieves today stats via /api/dashboard", async () => {
    const res = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const stats = body.dashboard || body.data;
    assert.equal(typeof stats.orderCount, "number");
    assert.equal(typeof stats.revenueCents, "number");
  });

  await t.test(
    "retrieves today stats via alias /api/dashboard/today",
    async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/today`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      const stats = body.dashboard || body.data;
      assert.equal(typeof stats.orderCount, "number");
      assert.equal(typeof stats.revenueCents, "number");
    },
  );

  await t.test(
    "accurately counts orders and aggregates revenue only for paid orders",
    async () => {
      // 1. Get initial metrics
      const initialRes = await fetch(`${baseUrl}/api/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const initialData = (await initialRes.json()).dashboard;

      // 2. Get an active menu item
      const menuRes = await fetch(`${baseUrl}/api/menu`);
      const menuBody = await menuRes.json();
      const item = menuBody.data[0];

      // 3. Create open order (should increment orderCount, but NOT revenue)
      const orderRes = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          items: [{ menuItemId: item.id, quantity: 2 }],
        }),
      });
      const order = (await orderRes.json()).order;

      const afterOpenRes = await fetch(`${baseUrl}/api/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const afterOpenData = (await afterOpenRes.json()).dashboard;
      assert.equal(afterOpenData.orderCount, initialData.orderCount + 1);
      assert.equal(afterOpenData.revenueCents, initialData.revenueCents);

      // 4. Mark order as paid (should now increment revenueCents)
      await fetch(`${baseUrl}/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: "paid" }),
      });

      const afterPaidRes = await fetch(`${baseUrl}/api/dashboard`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const afterPaidData = (await afterPaidRes.json()).dashboard;
      assert.equal(afterPaidData.orderCount, initialData.orderCount + 1);
      assert.equal(
        afterPaidData.revenueCents,
        initialData.revenueCents + item.priceCents * 2,
      );
    },
  );
});
