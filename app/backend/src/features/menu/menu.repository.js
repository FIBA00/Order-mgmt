import { eq, asc } from "drizzle-orm";

export function createMenuRepository({ db, schema }) {
  const { menuItems } = schema;

  async function findAll() {
    return db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        active: menuItems.active,
        createdAt: menuItems.createdAt,
      })
      .from(menuItems)
      .orderBy(asc(menuItems.name));
  }

  async function findById(id) {
    const [item] = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        active: menuItems.active,
        createdAt: menuItems.createdAt,
      })
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);

    return item ?? null;
  }

  async function create({ name, priceCents }) {
    const [existingItem] = await db
      .select({ name: menuItems.name })
      .from(menuItems)
      .where(eq(menuItems.name, name));

    if (existingItem) {
      return null;
    }
    const [newItem] = await db
      .insert(menuItems)
      .values({
        name,
        priceCents,
      })
      .returning({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        active: menuItems.active,
        createdAt: menuItems.createdAt,
      });

    return newItem;
  }

  async function update(id, data) {
    const [item] = await db
      .update(menuItems)
      .set(data)
      .where(eq(menuItems.id, id))
      .returning({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        active: menuItems.active,
        createdAt: menuItems.createdAt,
      });

    return item ?? null;
  }
  async function deleteMenu(id) {
    const [item] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning();

    return item ?? null;
  }

  async function setActive(id, active) {
    return update(id, { active });
  }

  return {
    findAll,
    findById,
    create,
    update,
    deleteMenu,
    setActive,
  };
}
