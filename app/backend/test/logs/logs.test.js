import test from "node:test";
import assert from "node:assert/strict";
import { createTestServer } from "../helpers/test-server.js";

test("POST /api/logs/upload validates payload", async () => {
  const { baseUrl, close } = createTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/logs/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "frontend" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "logs must be an array");
  } finally {
    await close();
  }
});

test("POST /api/logs/upload accepts and appends log array", async () => {
  const { baseUrl, close } = createTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/logs/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "desktop",
        logs: [
          { level: "info", message: "app started", timestamp: new Date().toISOString() },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.count, 1);
  } finally {
    await close();
  }
});
