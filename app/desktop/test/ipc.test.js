const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { setupElectronMock } = require("./helpers/mock-electron.js");
const { initLocalDatabase } = require("../src/db/local-db.js");
const { getBackendSrcDir } = require("../src/config/app.config.js");

test("Desktop IPC Handlers & Security Guards", async t => {
  const { invoke, clearHandlers } = setupElectronMock();
  const { registerAllIpc } = require("../src/ipc/index.js");

  const backendSrcDir = getBackendSrcDir(false);
  const testDbDir = path.join("/tmp", `desktop-ipc-test-${Date.now()}`);
  const testDbPath = path.join(testDbDir, "test.sqlite");

  const { db, services } = initLocalDatabase(backendSrcDir, testDbPath);
  registerAllIpc(services);

  t.after(() => {
    db.close();
    clearHandlers();
    try {
      fs.rmSync(testDbDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  await t.test("rejects unauthenticated access to protected IPC channels", async () => {
    assert.throws(() => invoke("auth:me"), /Authentication required/);
    assert.throws(() => invoke("menu:list"), /Authentication required/);
    assert.throws(() => invoke("orders:list"), /Authentication required/);
    assert.throws(() => invoke("dashboard:today"), /Authentication required/);
  });

  await t.test("rejects login with invalid credentials", async () => {
    assert.throws(
      () => invoke("auth:login", { username: "admin", password: "wrongpassword" }),
      /Invalid username or password/
    );
  });

  await t.test("rejects login with malformed input payload", async () => {
    assert.throws(() => invoke("auth:login", { username: "" }), /invalid/i);
  });

  await t.test("authenticates user and enables access to protected channels", async () => {
    const user = invoke("auth:login", { username: "admin", password: "admin123" });
    assert.ok(user);
    assert.equal(user.username, "admin");
    assert.equal(user.role, "admin");

    const me = invoke("auth:me");
    assert.equal(me.username, "admin");

    const menu = invoke("menu:list");
    assert.ok(Array.isArray(menu));
    assert.equal(menu.length, 5);
  });

  let createdItemId = null;

  await t.test("creates and deletes menu item via admin IPC", async () => {
    const newItem = invoke("menu:create", { name: "Matcha Latte", priceCents: 520 });
    assert.ok(newItem);
    assert.equal(newItem.name, "Matcha Latte");
    assert.equal(newItem.priceCents, 520);
    createdItemId = newItem.id;

    const list = invoke("menu:list");
    assert.equal(list.length, 6);

    const deleteResult = invoke("menu:delete", createdItemId);
    assert.deepEqual(deleteResult, { ok: true, id: createdItemId });

    const afterDelete = invoke("menu:list");
    assert.equal(afterDelete.length, 5);
  });

  let createdOrderId = null;

  await t.test("creates order and updates status via orders IPC", async () => {
    const menu = invoke("menu:list");
    const item = menu[0];

    const order = invoke("orders:create", {
      items: [{ menuItemId: item.id, quantity: 2 }],
      note: "Table 4"
    });
    assert.ok(order);
    assert.equal(order.status, "open");
    assert.equal(order.totalCents, item.priceCents * 2);
    createdOrderId = order.id;

    const ordersList = invoke("orders:list");
    assert.ok(ordersList.length >= 1);

    const updateResult = invoke("orders:set-status", { id: createdOrderId, status: "paid" });
    assert.deepEqual(updateResult, { ok: true, id: createdOrderId, status: "paid" });
  });

  await t.test("retrieves dashboard metrics via IPC", async () => {
    const stats = invoke("dashboard:today");
    assert.ok(stats);
    assert.ok(stats.orderCount >= 1);
    assert.ok(stats.revenueCents > 0);
  });

  await t.test("retrieves application metadata via app IPC", async () => {
    const info = invoke("app:get-info");
    assert.equal(info.version, "0.1.0");
    assert.ok(info.userDataPath);
  });

  await t.test("logs out user and revokes access to protected channels", async () => {
    const logoutResult = invoke("auth:logout");
    assert.deepEqual(logoutResult, { ok: true });

    assert.throws(() => invoke("auth:me"), /Authentication required/);
    assert.throws(() => invoke("orders:list"), /Authentication required/);
  });
});
