import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createReceiptPdf, createFinancialReportPdf } from "../src/utils/pdf.js";

describe("PDF Generation Utilities", () => {
  const sampleMenu = [
    { id: 1, name: "Espresso", priceCents: 350 },
    { id: 2, name: "Croissant", priceCents: 450 },
  ];

  const sampleOrder = {
    id: 42,
    createdAt: "2026-10-13T20:00:00.000Z",
    status: "paid",
    totalCents: 1150,
    items: [
      { menuItemId: 1, name: "Espresso", unitPriceCents: 350, quantity: 2 },
      { menuItemId: 2, name: "Croissant", unitPriceCents: 450, quantity: 1 },
    ],
    note: "[dine-in:Table 3] extra hot [customer:Alex] [barista:Sam]",
  };

  const sampleStore = {
    name: "Cafe Espresso",
    address: "742 Evergreen Terrace",
    phone: "(555) 019-2834",
    taxRatePercent: 10,
    receiptHeader: "Freshly brewed daily",
    receiptFooter: "Thank you for stopping by!",
  };

  test("createReceiptPdf generates an 80mm thermal receipt PDF", () => {
    const doc = createReceiptPdf({
      order: sampleOrder,
      menuItems: sampleMenu,
      store: sampleStore,
    });

    assert.ok(doc, "jsPDF instance should be created");
    assert.equal(typeof doc.output, "function");
    assert.equal(doc.getNumberOfPages(), 1);

    // Verify 80mm width in page format
    const width = doc.internal.pageSize.getWidth();
    assert.equal(Math.round(width), 80);
  });

  test("createReceiptPdf handles fallback orders without items array", () => {
    const fallbackOrder = {
      id: 99,
      status: "open",
      totalCents: 850,
      createdAt: null,
    };

    const doc = createReceiptPdf({
      order: fallbackOrder,
      menuItems: [],
      store: {},
    });

    assert.ok(doc);
    assert.equal(doc.getNumberOfPages(), 1);
  });

  test("createFinancialReportPdf generates an A4 financial report with tables", () => {
    const orders = [
      sampleOrder,
      {
        id: 43,
        createdAt: "2026-10-13T21:00:00.000Z",
        status: "open",
        totalCents: 500,
        items: [{ menuItemId: 1, quantity: 1, priceCents: 500 }],
        note: "[takeaway] [customer:Jordan]",
      },
      {
        id: 44,
        createdAt: "2026-10-13T21:30:00.000Z",
        status: "cancelled",
        totalCents: 450,
        items: [],
      },
    ];

    const doc = createFinancialReportPdf({
      orders,
      menu: sampleMenu,
      period: "today",
      store: sampleStore,
      user: { username: "admin" },
    });

    assert.ok(doc);
    assert.equal(typeof doc.output, "function");
    assert.ok(doc.getNumberOfPages() >= 1);

    // A4 width in mm is ~210mm
    const width = doc.internal.pageSize.getWidth();
    assert.equal(Math.round(width), 210);
  });
});
