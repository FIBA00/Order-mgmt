import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../../src/middlewares/rate-limit.middleware.js";

test("Rate Limit Middleware", async (t) => {
  await t.test("allows requests under the rate limit threshold", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 2,
      enableInTest: true,
    });

    let nextCalled = 0;
    const req = { ip: "127.0.0.1" };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };

    limiter(req, res, () => {
      nextCalled += 1;
    });
    limiter(req, res, () => {
      nextCalled += 1;
    });

    assert.equal(nextCalled, 2);
    assert.equal(res.statusCode, undefined);
  });

  await t.test("blocks requests exceeding threshold with status 429", () => {
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 2,
      enableInTest: true,
    });

    let nextCalled = 0;
    const req = { ip: "192.168.1.10" };
    const res = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      },
    };

    limiter(req, res, () => {
      nextCalled += 1;
    });
    limiter(req, res, () => {
      nextCalled += 1;
    });
    limiter(req, res, () => {
      nextCalled += 1;
    });

    assert.equal(nextCalled, 2);
    assert.equal(res.statusCode, 429);
    assert.equal(res.body?.success, false);
  });
});
