import { eq, asc } from "drizzle-orm";
import { menuItems } from "../../database/models.js";
import { database } from "../../database/database.js";

export default function MenuService() {
  async function list() {
    const items = await database
      .select({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents, // FIX: was menuItems.price_cents
        active: menuItems.active,
      })
      .from(menuItems)
      .orderBy(asc(menuItems.name));
    return items;
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
    return item;
  }

  async function setActive(id, active) {
    const [item] = await database
      .update(menuItems)
      .set({ active })
      .where(eq(menuItems.id, id))
      .returning({ id: menuItems.id });

    return item;
  }

  return { list, create, setActive, update };
}
