import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { money } from "../src/utils/money.js";

describe("money() currency formatter", () => {
  test("formats standard integer cents to USD format", () => {
    assert.equal(money(350), "$3.50");
    assert.equal(money(1299), "$12.99");
    assert.equal(money(100), "$1.00");
  });

  test("handles zero cents correctly", () => {
    assert.equal(money(0), "$0.00");
  });

  test("handles null or undefined safely", () => {
    assert.equal(money(null), "$0.00");
    assert.equal(money(undefined), "$0.00");
    assert.equal(money(""), "$0.00");
  });

  test("handles large integer cents", () => {
    assert.equal(money(150000), "$1500.00");
  });
});
