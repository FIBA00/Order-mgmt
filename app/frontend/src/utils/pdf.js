import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { money } from "./money.js";
import { parseOrderDetails, parseDiningInfo } from "./order.js";

// Helper to draw clean divider line on thermal receipts
function drawDashedLine(doc, y, startX = 5, endX = 75) {
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(180, 180, 180);
  doc.line(startX, y, endX, y);
  doc.setLineDashPattern([], 0);
}

// ── 1. POS Thermal Receipt Generator (80mm width) ──────────────────────────────

export function createReceiptPdf({ order, menuItems = [], store = {} }) {
  if (!order) throw new Error("Order data is required for receipt generation");

  const taxRate = store.taxRatePercent !== undefined ? store.taxRatePercent : 8.5;
  const storeName = store.name || "The Artisan Roast Cafe";
  const storeAddress = store.address || "123 Coffee Lane, Suite 100";
  const storePhone = store.phone || "(555) 234-5678";

  // Resolve line items and calculate subtotal/tax
  const items = (order.items || []).map((line) => {
    const menuItem = menuItems.find((m) => m.id === line.menuItemId);
    return {
      name: line.name || (menuItem ? menuItem.name : `Item #${line.menuItemId}`),
      priceCents:
        line.unitPriceCents || line.priceCents || (menuItem ? menuItem.priceCents : 0),
      quantity: line.quantity || 1,
    };
  });

  const subtotalCents =
    items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0) ||
    order.totalCents ||
    0;
  const taxCents = Math.round(subtotalCents * (taxRate / 100));
  const grandTotalCents = subtotalCents + taxCents;

  const details = parseOrderDetails(order, menuItems);
  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : "Just now";

  // Dynamic receipt height based on lines
  const estimatedHeight = Math.max(
    110,
    75 + items.length * 8 + (details.cleanNote ? 10 : 0) + (store.receiptFooter ? 10 : 0),
  );

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, estimatedHeight],
  });

  let y = 8;

  // Header: Store Branding
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(storeName, 40, y, { align: "center" });
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(storeAddress, 40, y, { align: "center" });
  y += 3.5;
  doc.text(storePhone, 40, y, { align: "center" });
  y += 4;

  if (store.receiptHeader) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(`"${store.receiptHeader}"`, 40, y, { align: "center" });
    y += 4;
  }

  y += 1;
  drawDashedLine(doc, y);
  y += 4;

  // Order Metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`ORDER #${order.id}`, 6, y);
  doc.setFont("helvetica", "bold");
  doc.text(String(order.status || "OPEN").toUpperCase(), 74, y, { align: "right" });
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Date: ${formattedDate}`, 6, y);
  y += 3.5;

  if (details.customerName) {
    doc.text(`Customer: ${details.customerName}`, 6, y);
    y += 3.5;
  }

  doc.text(`Cashier: ${details.cashier}`, 6, y);
  if (details.barista) {
    doc.text(`Barista: ${details.barista}`, 74, y, { align: "right" });
  }
  y += 3.5;

  const diningModeStr =
    details.diningInfo.type === "takeaway"
      ? "Takeaway"
      : `Dine-In (${details.diningInfo.label || "Table"})`;
  doc.text(`Dining: ${diningModeStr}`, 6, y);
  y += 4;

  drawDashedLine(doc, y);
  y += 4;

  // Items Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("QTY  ITEM", 6, y);
  doc.text("TOTAL", 74, y, { align: "right" });
  y += 4;

  // Items List
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  if (items.length > 0) {
    items.forEach((item) => {
      const lineTotal = money(item.priceCents * item.quantity);
      const itemLabel = `${item.quantity}x  ${item.name}`;
      doc.text(itemLabel, 6, y);
      doc.text(lineTotal, 74, y, { align: "right" });
      y += 3.5;

      if (item.quantity > 1) {
        doc.setFontSize(6.5);
        doc.setTextColor(120, 120, 120);
        doc.text(`    @ ${money(item.priceCents)} each`, 6, y);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(7.5);
        y += 3.5;
      }
    });
  } else {
    doc.text(details.orderName || `Order #${order.id}`, 6, y);
    doc.text(money(order.totalCents), 74, y, { align: "right" });
    y += 4;
  }

  if (details.cleanNote) {
    y += 1;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.text(`Note: ${details.cleanNote}`, 6, y);
    y += 3.5;
  }

  y += 1;
  drawDashedLine(doc, y);
  y += 4;

  // Pricing Totals
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Subtotal", 6, y);
  doc.text(money(subtotalCents), 74, y, { align: "right" });
  y += 3.5;

  doc.text(`Tax (${taxRate}%)`, 6, y);
  doc.text(money(taxCents), 74, y, { align: "right" });
  y += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL", 6, y);
  doc.text(money(grandTotalCents), 74, y, { align: "right" });
  y += 5;

  drawDashedLine(doc, y);
  y += 4;

  // Footer Message
  if (store.receiptFooter) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(`"${store.receiptFooter}"`, 40, y, { align: "center" });
    y += 4;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(130, 130, 130);
  doc.text("Powered by Restaurant POS", 40, y, { align: "center" });

  return doc;
}

// Print thermal receipt PDF via isolated iframe without taking screenshots
export function printReceiptPdf(order, menuItems, store) {
  const doc = createReceiptPdf({ order, menuItems, store });
  const blobUrl = doc.output("bloburl");

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.bottom = "0";
  iframe.style.right = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(blobUrl, "_blank");
    }
    setTimeout(() => {
      try {
        iframe.remove();
      } catch {}
    }, 60000);
  };

  return doc;
}

// Download receipt PDF
export function downloadReceiptPdf(order, menuItems, store) {
  const doc = createReceiptPdf({ order, menuItems, store });
  doc.save(`receipt-order-${order.id}.pdf`);
  return doc;
}

// ── 2. Financial Summary & Ledger Report PDF Generator (A4 format) ─────────────

export function createFinancialReportPdf({
  orders = [],
  menu = [],
  period = "today",
  store = {},
  user = {},
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const storeName = store.name || "The Artisan Roast Cafe";
  const periodLabel = period === "today" ? "Today's Operations" : "All Time Records";
  const generatedTime = new Date().toLocaleString();

  // Metrics calculation
  const totalOrdersCount = orders.length;
  const paidOrders = orders.filter((o) => o.status === "paid");
  const openOrders = orders.filter((o) => o.status === "open");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const grossRevenueCents = paidOrders.reduce((sum, o) => sum + (o.totalCents || 0), 0);
  const avgTicketCents =
    paidOrders.length > 0 ? Math.round(grossRevenueCents / paidOrders.length) : 0;
  const pendingRevenueCents = openOrders.reduce(
    (sum, o) => sum + (o.totalCents || 0),
    0,
  );
  const cancelledRevenueCents = cancelledOrders.reduce(
    (sum, o) => sum + (o.totalCents || 0),
    0,
  );

  // Dining Mode Metrics
  let dineInCount = 0;
  let dineInCents = 0;
  let takeawayCount = 0;
  let takeawayCents = 0;

  paidOrders.forEach((o) => {
    const dining = parseDiningInfo(o.note);
    if (dining.type === "takeaway") {
      takeawayCount++;
      takeawayCents += o.totalCents || 0;
    } else {
      dineInCount++;
      dineInCents += o.totalCents || 0;
    }
  });

  // Page Header
  let y = 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text(storeName.toUpperCase(), 14, y);
  y += 6;

  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text("FINANCIAL & REVENUE REPORT", 14, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Scope: ${periodLabel}  |  Generated: ${generatedTime}  |  Generated by: ${user.username || "Admin"}`,
    14,
    y,
  );
  y += 7;

  // Executive Summary KPI Cards (rendered as clean table)
  autoTable(doc, {
    startY: y,
    theme: "grid",
    head: [["Gross Revenue", "Avg Ticket", "Pending Orders", "Cancelled Lost"]],
    body: [
      [
        money(grossRevenueCents),
        money(avgTicketCents),
        `${money(pendingRevenueCents)} (${openOrders.length})`,
        `${money(cancelledRevenueCents)} (${cancelledOrders.length})`,
      ],
    ],
    headStyles: {
      fillColor: [245, 158, 11], // Amber-500
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 11,
      fontStyle: "bold",
      textColor: [20, 20, 20],
      halign: "center",
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Dining Mode Breakdown
  autoTable(doc, {
    startY: y,
    theme: "striped",
    head: [["Channel", "Paid Orders", "Revenue", "Share of Sales"]],
    body: [
      [
        "Dine-In Orders",
        `${dineInCount}`,
        money(dineInCents),
        grossRevenueCents > 0
          ? `${Math.round((dineInCents / grossRevenueCents) * 100)}%`
          : "0%",
      ],
      [
        "Takeaway Orders",
        `${takeawayCount}`,
        money(takeawayCents),
        grossRevenueCents > 0
          ? `${Math.round((takeawayCents / grossRevenueCents) * 100)}%`
          : "0%",
      ],
    ],
    headStyles: {
      fillColor: [68, 64, 60], // Stone-700
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 30, 30],
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;

  // Transactions Ledger Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(`Transactions Ledger (${orders.length} total entries)`, 14, y);
  y += 4;

  const tableRows = orders.map((order) => {
    const details = parseOrderDetails(order, menu);
    const dateFormatted = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    const diningStr =
      details.diningInfo.type === "takeaway"
        ? "Takeaway"
        : details.diningInfo.label || "Dine-In";

    return [
      `#${order.id}`,
      dateFormatted,
      details.customerName || "-",
      details.cashier || "Cashier",
      details.orderName || "Ticket",
      diningStr,
      String(order.status || "").toUpperCase(),
      money(order.totalCents),
    ];
  });

  autoTable(doc, {
    startY: y,
    theme: "striped",
    head: [
      ["ID", "Date/Time", "Customer", "Cashier", "Items Summary", "Mode", "Status", "Total"],
    ],
    body: tableRows,
    headStyles: {
      fillColor: [180, 83, 9], // Amber-700
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 48 },
      5: { cellWidth: 20 },
      6: { cellWidth: 17 },
      7: { cellWidth: 20, halign: "right" },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Page footer
      const pageStr = `Page ${doc.internal.getNumberOfPages()}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 150, 150);
      doc.text(pageStr, 196, 290, { align: "right" });
      doc.text("Restaurant Order Manager — Confidential Financial Report", 14, 290);
    },
  });

  return doc;
}

// Print financial report PDF via isolated iframe without taking screenshots
export function printFinancialReportPdf({ orders, menu, period, store, user }) {
  const doc = createFinancialReportPdf({ orders, menu, period, store, user });
  const blobUrl = doc.output("bloburl");

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.bottom = "0";
  iframe.style.right = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.open(blobUrl, "_blank");
    }
    setTimeout(() => {
      try {
        iframe.remove();
      } catch {}
    }, 60000);
  };

  return doc;
}

// Download financial report PDF
export function downloadFinancialReportPdf({ orders, menu, period, store, user }) {
  const doc = createFinancialReportPdf({ orders, menu, period, store, user });
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`financial-report-${period}-${dateStr}.pdf`);
  return doc;
}
