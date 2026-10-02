const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  getBackendSrcDir,
  getFrontendIndexPath,
  getDatabasePath,
  windowConfig,
} = require("../src/config/app.config.js");

test("Desktop Configuration Module", async (t) => {
  await t.test("resolves development backend directory correctly", () => {
    const backendDir = getBackendSrcDir(false);
    assert.ok(
      fs.existsSync(backendDir),
      `Backend directory must exist: ${backendDir}`,
    );
    assert.ok(
      fs.existsSync(path.join(backendDir, "db")),
      "db directory must exist under backendSrcDir",
    );
    assert.ok(
      fs.existsSync(path.join(backendDir, "services")),
      "services directory must exist under backendSrcDir",
    );
  });

  await t.test("resolves packaged backend directory format", () => {
    const packagedDir = getBackendSrcDir(true);
    assert.ok(
      packagedDir.includes("backend"),
      "Should resolve backend path for packaged app",
    );
  });

  await t.test(
    "constructs SQLite database path under userData directory",
    () => {
      const userData = "/mock/user/data";
      const dbPath = getDatabasePath(userData);
      assert.equal(dbPath, path.join(userData, "data", "restaurant.sqlite"));
    },
  );

  await t.test("provides valid window geometry configuration", () => {
    assert.ok(windowConfig.width >= windowConfig.minWidth);
    assert.ok(windowConfig.height >= windowConfig.minHeight);
    assert.equal(windowConfig.width, 1200);
    assert.equal(windowConfig.height, 800);
  });
});
