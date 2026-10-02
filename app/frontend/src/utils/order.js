// Order calculation and cart manipulation utilities

export function calculateOrderTotal(items = [], menuItems = []) {
  if (!Array.isArray(items) || !items.length) return 0;

  return items.reduce((total, line) => {
    const found = menuItems.find(m => m.id === line.menuItemId);
    const priceCents = found ? found.priceCents : 0;
    const quantity = Math.max(1, Number(line.quantity) || 1);
    return total + priceCents * quantity;
  }, 0);
}

export function filterOrders(orders = [], { status = "all", search = "" } = {}) {
  return orders.filter(order => {
    // Status filter
    if (status !== "all" && order.status !== status) {
      return false;
    }
    // Search query filter (matches ID or customer/table note)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const idMatch = String(order.id).toLowerCase().includes(q);
      const noteMatch = (order.note || "").toLowerCase().includes(q);
      if (!idMatch && !noteMatch) return false;
    }
    return true;
  });
}
