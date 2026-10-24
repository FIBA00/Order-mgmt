// Order calculation and cart manipulation utilities

export function calculateOrderTotal(items = [], menuItems = []) {
  if (!Array.isArray(items) || !items.length) return 0;

  return items.reduce((total, line) => {
    const found = menuItems.find((m) => m.id === line.menuItemId);
    const priceCents = found ? found.priceCents : 0;
    const quantity = Math.max(1, Number(line.quantity) || 1);
    return total + priceCents * quantity;
  }, 0);
}

// Parse dining metadata (e.g. [Table 4 | Dine-In] or [Takeaway]) from order note
export function parseDiningInfo(note = "") {
  if (!note || typeof note !== "string") {
    return { type: "unknown", label: "", cleanNote: "" };
  }
  const match = note.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    const tag = match[1];
    const cleanNote = match[2];
    const isTakeaway = tag.toLowerCase().includes("takeaway");
    return {
      type: isTakeaway ? "takeaway" : "dine-in",
      label: tag,
      cleanNote,
    };
  }
  if (note.toLowerCase().includes("takeaway")) {
    return { type: "takeaway", label: "Takeaway", cleanNote: note };
  }
  const tableMatch = note.match(/(table\s*\d+|bar\s*\d+)/i);
  if (tableMatch) {
    return { type: "dine-in", label: tableMatch[0], cleanNote: note };
  }
  return { type: "unknown", label: "", cleanNote: note };
}

export function formatOrderTime(dateValue) {
  if (!dateValue) return "Just now";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today, ${timeStr}`;
  const dateStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
  return `${dateStr}, ${timeStr}`;
}

export function parseOrderDetails(order = {}, menuItems = []) {
  const note = order.note || "";
  const diningInfo = parseDiningInfo(note);

  // Extract customer name
  let customerName = order.customerName || order.customer || "";
  if (!customerName && note) {
    const custMatch = note.match(/\[Customer:\s*([^\]]+)\]/i);
    if (custMatch) customerName = custMatch[1].trim();
  }

  // Extract barista
  let barista = order.barista || "";
  if (!barista && note) {
    const barMatch = note.match(/\[Barista:\s*([^\]]+)\]/i);
    if (barMatch) barista = barMatch[1].trim();
  }

  // Cashier from joined users.username or cashier property
  const cashier = order.username || order.cashier || "Staff";

  // Build order item summary / name
  let orderName = order.name || order.orderName || "";
  if (!orderName && Array.isArray(order.items) && order.items.length > 0) {
    const itemNames = order.items.map((line) => {
      const menuItem = menuItems.find((m) => m.id === line.menuItemId);
      const name =
        line.name || (menuItem ? menuItem.name : `Item #${line.menuItemId}`);
      const qty = line.quantity || 1;
      return `${qty}× ${name}`;
    });
    orderName = itemNames.join(", ");
  }
  if (!orderName) {
    orderName = `Order #${order.id || "—"}`;
  }

  // Strip metadata tags from cleanNote
  let cleanNote = diningInfo.cleanNote || "";
  cleanNote = cleanNote
    .replace(/\[Customer:\s*[^\]]+\]/gi, "")
    .replace(/\[Barista:\s*[^\]]+\]/gi, "")
    .replace(/\|\s*Mods:.*$/gi, "")
    .trim();

  return {
    orderId: order.id,
    orderName,
    amountCents: order.totalCents || 0,
    status: order.status || "open",
    customerName: customerName || null,
    cashier,
    barista: barista || null,
    diningInfo,
    cleanNote,
    formattedTime: formatOrderTime(order.createdAt),
    offline: Boolean(order.offline),
  };
}

export function filterOrders(
  orders = [],
  { status = "all", search = "", dining = "all" } = {},
) {
  return orders.filter((order) => {
    // Status filter
    if (status !== "all" && order.status !== status) {
      return false;
    }
    // Dining filter (dine-in vs takeaway)
    if (dining && dining !== "all") {
      const info = parseDiningInfo(order.note);
      if (dining === "dine-in" && info.type !== "dine-in") return false;
      if (dining === "takeaway" && info.type !== "takeaway") return false;
    }
    // Search query filter (matches ID, customer, barista, note, cashier, or items)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const idMatch = String(order.id).toLowerCase().includes(q);
      const noteMatch = (order.note || "").toLowerCase().includes(q);
      const userMatch = (order.username || "").toLowerCase().includes(q);
      const customerMatch = (order.customerName || "").toLowerCase().includes(q);
      const baristaMatch = (order.barista || "").toLowerCase().includes(q);
      const itemMatch = (order.items || []).some((i) =>
        (i.name || "").toLowerCase().includes(q),
      );
      if (
        !idMatch &&
        !noteMatch &&
        !userMatch &&
        !customerMatch &&
        !baristaMatch &&
        !itemMatch
      ) {
        return false;
      }
    }
    return true;
  });
}

