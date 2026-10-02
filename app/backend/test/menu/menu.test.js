import test from "node:test";
import assert from "node:assert/strict";
import { createTestServer } from "../helpers/test-server.js";

test("Menu Module", async (t) => {
  const { baseUrl, close } = createTestServer();

  t.after(async () => {
    await close();
  });

  let createdItemId = null;
  const uniqueItemName = `Coffee_${Date.now()}`;

  await t.test("lists existing menu items", async () => {
    const res = await fetch(`${baseUrl}/api/menu`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  await t.test("creates a new menu item", async () => {
    const res = await fetch(`${baseUrl}/api/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: uniqueItemName,
        priceCents: 450,
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, uniqueItemName);
    assert.equal(body.data.priceCents, 450);
    assert.equal(body.data.active, true);
    createdItemId = body.data.id;
  });

  await t.test("retrieves the created menu item by ID", async () => {
    const res = await fetch(`${baseUrl}/api/menu/${createdItemId}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.id, createdItemId);
    assert.equal(body.data.name, uniqueItemName);
  });

  await t.test("rejects creating duplicate menu item with same name", async () => {
    const res = await fetch(`${baseUrl}/api/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: uniqueItemName,
        priceCents: 500,
      }),
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects creating menu item with invalid price", async () => {
    const res = await fetch(`${baseUrl}/api/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Invalid_${Date.now()}`,
        priceCents: -100,
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("updates menu item price", async () => {
    const res = await fetch(`${baseUrl}/api/menu/${createdItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceCents: 550,
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.priceCents, 550);
  });

  await t.test("deletes the created menu item", async () => {
    const res = await fetch(`${baseUrl}/api/menu/${createdItemId}`, {
      method: "DELETE",
    });
    assert.equal(res.status, 203);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  await t.test("returns 404 when deleting non-existent menu item", async () => {
    const res = await fetch(`${baseUrl}/api/menu/999999`, {
      method: "DELETE",
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
