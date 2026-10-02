export function createOrdersService(repository) {
  async function list() {
    return repository.findAll();
  }

  async function get(id) {
    const order = await repository.findById(id);
    if (!order) {
      const err = new Error(`Order ${id} not found`);
      err.statusCode = 404;
      throw err;
    }
    return order;
  }

  async function create(userId, items) {
    if (!items || items.length === 0) {
      const err = new Error("Order must contain at least one item");
      err.statusCode = 400;
      throw err;
    }

    const menuIds = items.map((i) => i.menuItemId);
    const menuList = await repository.findMenuItemsByIds(menuIds);
    const menuMap = new Map(menuList.map((m) => [m.id, m]));

    let totalCents = 0;
    const resolvedItems = [];

    for (const item of items) {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem || !menuItem.active) {
        const err = new Error(
          `Menu item ${item.menuItemId} not found or inactive`,
        );
        err.statusCode = 400;
        throw err;
      }

      totalCents += menuItem.priceCents * item.quantity;
      resolvedItems.push({
        menuItemId: menuItem.id,
        quantity: item.quantity,
        unitPriceCents: menuItem.priceCents,
      });
    }

    return repository.create({
      userId,
      totalCents,
      items: resolvedItems,
    });
  }

  async function setStatus(id, status) {
    const existing = await repository.findById(id);
    if (!existing) {
      const err = new Error(`Order ${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    return repository.updateStatus(id, status);
  }

  return {
    list,
    get,
    create,
    setStatus,
  };
}
