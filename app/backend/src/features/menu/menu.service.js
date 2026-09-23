const { eq, asc } = require("drizzle-orm");
const { menuItems } = require("../../db/schema");
const { createError } = require("../../middleware/errors");

function createMenuService(db) {
  async function list() {
    return db
      .select({
        id:         menuItems.id,
        name:       menuItems.name,
        priceCents: menuItems.priceCents,
        active:     menuItems.active
      })
      .from(menuItems)
      .orderBy(asc(menuItems.name));
  }

  async function create(name, priceCents) {
    const [item] = await db
      .insert(menuItems)
      .values({ name, priceCents })
      .returning({
        id:         menuItems.id,
        name:       menuItems.name,
        priceCents: menuItems.priceCents,
        active:     menuItems.active
      });
    return item;
  }

  async function setActive(id, active) {
    const [item] = await db
      .update(menuItems)
      .set({ active })
      .where(eq(menuItems.id, id))
      .returning({ id: menuItems.id });

    if (!item) throw createError(`Menu item ${id} not found`, 404);
    return item;
  }

  return { list, create, setActive };
}

module.exports = { createMenuService };
