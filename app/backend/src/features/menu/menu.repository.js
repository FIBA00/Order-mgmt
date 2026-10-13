import { eq, asc } from "drizzle-orm";

export function createMenuRepository({ db, schema }) {
  const { menuItems } = schema;

  async function findAll() {
    return db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        category: menuItems.category,
        active: menuItems.active,
        createdAt: menuItems.createdAt,
      })
      .from(menuItems)
      .where(eq(menuItems.active, true))
      .orderBy(asc(menuItems.name));
  }

  async function findById(id) {
    const [item] = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        category: menuItems.category,
        active: menuItems.active,
        createdAt: menuItems.createdAt,
      })
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);

    return item ?? null;
  }

  async function create({ name, priceCents, category }) {
    const [existingItem] = await db
      .select({ name: menuItems.name })
      .from(menuItems)
      .where(eq(menuItems.name, name));

    if (existingItem) {
      return null;
    }

    const insertValues = { name, priceCents };
    if (category !== undefined) insertValues.category = category;

    const [newItem] = await db
      .insert(menuItems)
      .values(insertValues)
      .returning({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        category: menuItems.category,
        active: menuItems.active,
        createdAt: menuItems.createdAt,
      });

    return newItem ?? null;
  }

  async function update(id, data) {
    const setValues = {};
    if (data.name !== undefined) setValues.name = data.name;
    if (data.priceCents !== undefined) setValues.priceCents = data.priceCents;
    if (data.category !== undefined) setValues.category = data.category;
    if (data.active !== undefined) setValues.active = data.active;

    const [item] = await db
      .update(menuItems)
      .set(setValues)
      .where(eq(menuItems.id, id))
      .returning({
        id: menuItems.id,
        name: menuItems.name,
        priceCents: menuItems.priceCents,
        category: menuItems.category,
        active: menuItems.active,
        createdAt: menuItems.createdAt,
      });

    return item ?? null;
  }
  async function deleteMenu(id) {
    try {
      const [item] = await db
        .delete(menuItems)
        .where(eq(menuItems.id, id))
        .returning();

      return item ?? null;
    } catch (err) {
      if (
        err.code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
        err.code === "23503" ||
        err.message?.includes("FOREIGN KEY")
      ) {
        return update(id, { active: false });
      }
      throw err;
    }
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
