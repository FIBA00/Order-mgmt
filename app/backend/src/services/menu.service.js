import { eq, asc } from "drizzle-orm";
import { sqliteSchema } from "../database/index.js";

/**
 * Creates menu service bound to database instance.
 *
 * @param {object} db - Drizzle database instance
 * @returns {object} Menu domain service
 */
export function createMenuService(db) {
  const schema = db.schema || sqliteSchema;
  const { menuItems } = schema;

  return {
    list() {
      return db
        .select({
          id: menuItems.id,
          name: menuItems.name,
          priceCents: menuItems.priceCents,
          category: menuItems.category,
          active: menuItems.active,
        })
        .from(menuItems)
        .where(eq(menuItems.active, true))
        .orderBy(asc(menuItems.name))
        .all();
    },

    create(nameOrInput, maybePrice, maybeCategory) {
      let name;
      let priceCents;
      let category = "Food";

      if (typeof nameOrInput === "object" && nameOrInput !== null) {
        name = nameOrInput.name;
        priceCents = nameOrInput.priceCents;
        category = nameOrInput.category || "Food";
      } else {
        name = nameOrInput;
        priceCents = maybePrice;
        category = maybeCategory || "Food";
      }

      const [created] = db
        .insert(menuItems)
        .values({
          name,
          priceCents,
          category,
        })
        .returning({
          id: menuItems.id,
          name: menuItems.name,
          priceCents: menuItems.priceCents,
          category: menuItems.category,
          active: menuItems.active,
        })
        .all();

      return created;
    },

    update(id, updates) {
      const setValues = {};
      if (updates.name !== undefined) setValues.name = updates.name;
      if (updates.priceCents !== undefined) setValues.priceCents = updates.priceCents;
      if (updates.category !== undefined) setValues.category = updates.category;
      if (updates.active !== undefined) setValues.active = updates.active;

      if (Object.keys(setValues).length > 0) {
        db.update(menuItems)
          .set(setValues)
          .where(eq(menuItems.id, id))
          .run();
      }

      return db
        .select({
          id: menuItems.id,
          name: menuItems.name,
          priceCents: menuItems.priceCents,
          category: menuItems.category,
          active: menuItems.active,
        })
        .from(menuItems)
        .where(eq(menuItems.id, id))
        .get();
    },

    delete(id) {
      try {
        return db.delete(menuItems).where(eq(menuItems.id, id)).run();
      } catch (err) {
        if (err.message && err.message.includes("FOREIGN KEY")) {
          return db
            .update(menuItems)
            .set({ active: false })
            .where(eq(menuItems.id, id))
            .run();
        }
        throw err;
      }
    },
  };
}
