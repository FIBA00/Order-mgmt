import test from "node:test";
import assert from "node:assert/strict";
import { createTestServer, createTestToken } from "../helpers/test-server.js";

test("Auth Module", async (t) => {
  const { baseUrl, close } = createTestServer();

  t.after(async () => {
    await close();
  });

  await t.test("rejects login with non-existent user", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "unknown_user_404",
        password: "password123",
      }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects signup with empty fields", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "",
        password: "",
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  const uniqueUsername = `auth_user_${Date.now()}`;

  await t.test("registers a new user and sets cookie", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: uniqueUsername,
        password: "securepassword123",
        role: "cashier",
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.token);
    assert.equal(body.user.username, uniqueUsername);
    assert.equal(body.user.role, "cashier");
    assert.ok(res.headers.get("set-cookie"));
  });

  await t.test("rejects signup with duplicate username", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: uniqueUsername,
        password: "anotherpassword",
      }),
    });
    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects login with wrong password", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: uniqueUsername,
        password: "wrongpassword",
      }),
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  let userToken = null;

  await t.test("logs in with valid credentials", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: uniqueUsername,
        password: "securepassword123",
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.token);
    userToken = body.token;
  });

  await t.test("rejects /api/auth/me without token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("rejects /api/auth/me with invalid token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    assert.equal(res.status, 401);
  });

  await t.test("retrieves current user profile with Bearer token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.username, uniqueUsername);
    assert.equal(body.user.role, "cashier");
  });

  await t.test("retrieves profile using cookie authentication", async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: `accessToken=${userToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.user.username, uniqueUsername);
  });

  let adminUser = null;
  let adminToken = null;
  const adminUsername = `admin_${Date.now()}`;

  await t.test("registers an admin user for staff management", async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: adminUsername,
        password: "adminpassword123",
        role: "admin",
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    adminUser = body.user;
    adminToken = body.token;
  });

  await t.test("lists staff members as admin", async () => {
    const res = await fetch(`${baseUrl}/api/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.staff || body.data));
  });

  await t.test("rejects deleting own admin account", async () => {
    const res = await fetch(`${baseUrl}/api/auth/users/${adminUser.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.message, /Cannot delete your own/);
  });

  let tempStaff = null;
  const tempStaffUsername = `cashier_${Date.now()}`;

  await t.test("provisions a new staff member and deletes them", async () => {
    const createRes = await fetch(`${baseUrl}/api/auth/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        username: tempStaffUsername,
        password: "password123",
        role: "cashier",
      }),
    });
    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    tempStaff = createBody.user || createBody.data;

    const deleteRes = await fetch(`${baseUrl}/api/auth/users/${tempStaff.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.equal(deleteBody.success, true);
  });

  await t.test("returns 404 when deleting non-existent staff member", async () => {
    const res = await fetch(`${baseUrl}/api/auth/users/999999`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test(
    "rejects deleting staff member with existing order history with 409 Conflict",
    async () => {
      const staffUser = `ordered_staff_${Date.now()}`;
      const createRes = await fetch(`${baseUrl}/api/auth/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          username: staffUser,
          password: "password123",
          role: "cashier",
        }),
      });
      const staff = (await createRes.json()).user;

      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: staffUser,
          password: "password123",
        }),
      });
      const staffToken = (await loginRes.json()).token;

      const menuRes = await fetch(`${baseUrl}/api/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Item_${Date.now()}`,
          priceCents: 400,
        }),
      });
      const menuItem = (await menuRes.json()).data;

      const orderRes = await fetch(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          items: [{ menuItemId: menuItem.id, quantity: 1 }],
        }),
      });
      assert.equal(orderRes.status, 201);

      const deleteRes = await fetch(`${baseUrl}/api/auth/users/${staff.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(deleteRes.status, 409);
      const deleteBody = await deleteRes.json();
      assert.equal(deleteBody.success, false);
      assert.match(deleteBody.message, /order history/i);
    },
  );
});
