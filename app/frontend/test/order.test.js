import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateOrderTotal,
  filterOrders,
  parseDiningInfo,
  formatOrderTime,
  parseOrderDetails,
} from "../src/utils/order.js";

describe("Order Calculation & Filtering", () => {
  const sampleMenu = [
    { id: 1, name: "Espresso", priceCents: 350 },
    { id: 2, name: "Croissant", priceCents: 300 },
    { id: 3, name: "Avocado Toast", priceCents: 850 },
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
      { menuItemId: 3, quantity: 1 }, // 850
    ];
    assert.equal(calculateOrderTotal(items, sampleMenu), 1800);
  });

  test("filterOrders filters by status", () => {
    const orders = [
      { id: 101, status: "open" },
      { id: 102, status: "paid" },
      { id: 103, status: "cancelled" },
    ];

    assert.equal(filterOrders(orders, { status: "open" }).length, 1);
    assert.equal(filterOrders(orders, { status: "paid" }).length, 1);
    assert.equal(filterOrders(orders, { status: "all" }).length, 3);
  });

  test("filterOrders filters by ID search query", () => {
    const orders = [
      { id: 101, status: "open" },
      { id: 202, status: "paid" },
    ];

    const result = filterOrders(orders, { search: "202" });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 202);
  });

  test("parseDiningInfo extracts dining tags correctly", () => {
    const dineIn = parseDiningInfo("[Table 4 | Dine-In] Window seat");
    assert.equal(dineIn.type, "dine-in");
    assert.equal(dineIn.label, "Table 4 | Dine-In");
    assert.equal(dineIn.cleanNote, "Window seat");

    const takeaway = parseDiningInfo("[Takeaway] Order for Sarah");
    assert.equal(takeaway.type, "takeaway");
    assert.equal(takeaway.cleanNote, "Order for Sarah");

    const untagged = parseDiningInfo("Extra napkins");
    assert.equal(untagged.type, "unknown");
  });

  test("filterOrders filters by dining type", () => {
    const orders = [
      { id: 1, status: "open", note: "[Table 1 | Dine-In]" },
      { id: 2, status: "open", note: "[Table 5 | Dine-In]" },
      { id: 3, status: "open", note: "[Takeaway] Quick pickup" },
      { id: 4, status: "paid", note: "No dining tag" },
    ];

    assert.equal(filterOrders(orders, { dining: "dine-in" }).length, 2);
    assert.equal(filterOrders(orders, { dining: "takeaway" }).length, 1);
    assert.equal(filterOrders(orders, { dining: "all" }).length, 4);
  });

  test("formatOrderTime formats dates and fallbacks safely", () => {
    assert.equal(formatOrderTime(null), "Just now");
    assert.equal(formatOrderTime(undefined), "Just now");
    const today = new Date().toISOString();
    assert.match(formatOrderTime(today), /^Today,/);
  });

  test("parseOrderDetails extracts full order metadata", () => {
    const rawOrder = {
      id: 55,
      totalCents: 950,
      status: "paid",
      username: "alice_cashier",
      createdAt: new Date().toISOString(),
      note: "[Table 2 | Dine-In] [Customer: Bob Smith] [Barista: Ken] Less ice",
      items: [
        { menuItemId: 1, quantity: 1, name: "Espresso" },
        { menuItemId: 2, quantity: 2, name: "Croissant" },
      ],
    };

    const details = parseOrderDetails(rawOrder, sampleMenu);
    assert.equal(details.orderId, 55);
    assert.equal(details.orderName, "1× Espresso, 2× Croissant");
    assert.equal(details.amountCents, 950);
    assert.equal(details.status, "paid");
    assert.equal(details.customerName, "Bob Smith");
    assert.equal(details.cashier, "alice_cashier");
    assert.equal(details.barista, "Ken");
    assert.equal(details.diningInfo.type, "dine-in");
    assert.equal(details.cleanNote, "Less ice");
    assert.match(details.formattedTime, /^Today,/);
  });
});


