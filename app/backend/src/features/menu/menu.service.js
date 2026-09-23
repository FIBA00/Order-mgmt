import { eq, asc } from "drizzle-orm";
import { menuItems } from "../../db/models.js";
import { createError } from "../../middleware/error.middleware.js";
import { database } from "../../db/database.js";

export default function MenuService() {
  async function list() {
    return database
      .select({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        active: menuItems.active,
      })
      .from(menuItems)
      .orderBy(asc(menuItems.name));
  }

  async function create(name, priceCents) {
    const [item] = await database
      .insert(menuItems)
      .values({ name, priceCents })
      .returning({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        active: menuItems.active,
      });
    return item;
  }
  async function update(id, data) {
    const [item] = await database
      .update(menuItems)
      .set({ name: data.name })
      .where(eq(menuItems.id, id))
      .returning();
    if (!item) throw updateError(`Updating menu item ${id} failed`);
    return item;
  }

  async function setActive(id, active) {
    const [item] = await database
      .update(menuItems)
      .set({ active })
      .where(eq(menuItems.id, id))
      .returning({ id: menuItems.id });

    if (!item) throw createError(`Menu item ${id} not found`, 404);
    return item;
  }

  return { list, create, setActive };
}
