import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateOrderTotal, filterOrders } from "../src/utils/order.js";

describe("Order Calculation & Filtering", () => {
  const sampleMenu = [
    { id: 1, name: "Espresso", priceCents: 350 },
    { id: 2, name: "Croissant", priceCents: 300 },
    { id: 3, name: "Avocado Toast", priceCents: 850 }
  ];

  test("calculateOrderTotal returns 0 for empty cart", () => {
    assert.equal(calculateOrderTotal([], sampleMenu), 0);
  });

  test("calculateOrderTotal sums single item correctly", () => {
    const items = [{ menuItemId: 1, quantity: 2 }];
    assert.equal(calculateOrderTotal(items, sampleMenu), 700);
  });

  test("calculateOrderTotal sums multiple items with different quantities", () => {
    const items = [
      { menuItemId: 1, quantity: 1 }, // 350
      { menuItemId: 2, quantity: 2 }, // 600
      { menuItemId: 3, quantity: 1 }  // 850
    ];
    assert.equal(calculateOrderTotal(items, sampleMenu), 1800);
  });

  test("filterOrders filters by status", () => {
    const orders = [
      { id: 101, status: "open" },
      { id: 102, status: "paid" },
      { id: 103, status: "cancelled" }
    ];

    assert.equal(filterOrders(orders, { status: "open" }).length, 1);
    assert.equal(filterOrders(orders, { status: "paid" }).length, 1);
    assert.equal(filterOrders(orders, { status: "all" }).length, 3);
  });

  test("filterOrders filters by ID search query", () => {
    const orders = [
      { id: 101, status: "open" },
      { id: 202, status: "paid" }
    ];

    const result = filterOrders(orders, { search: "202" });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 202);
  });
});
