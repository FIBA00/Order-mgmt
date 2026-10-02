const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const { LOG_FILE, appendLog, initFileLogger } = require("../src/logger.js");

test("Desktop Logger Module", async (t) => {
  await t.test("exports valid LOG_FILE path in home directory", () => {
    assert.ok(typeof LOG_FILE === "string");
    assert.ok(LOG_FILE.includes(".restaurant-order-manager.log"));
  });

  await t.test("appendLog writes formatted lines to disk", () => {
    const testMsg = `TEST_LOG_ENTRY_${Date.now()}`;
    appendLog("INFO", testMsg, { foo: "bar" });

    assert.ok(fs.existsSync(LOG_FILE), "Log file should exist on disk");
    const content = fs.readFileSync(LOG_FILE, "utf8");
    assert.ok(
      content.includes(testMsg),
      "Log file should contain logged message",
    );
    assert.ok(content.includes("[INFO]"), "Log line should contain level");
  });

  await t.test("initFileLogger intercepts process and console logs", () => {
    const mockApp = { getVersion: () => "0.1.0-test" };
    const logger = initFileLogger(mockApp);
    assert.strictEqual(logger.LOG_FILE, LOG_FILE);

    const consoleMsg = `CONSOLE_TEST_${Date.now()}`;
    console.error(consoleMsg);

    const content = fs.readFileSync(LOG_FILE, "utf8");
    assert.ok(
      content.includes(consoleMsg),
      "Console error should be captured in log file",
    );
  });
});
