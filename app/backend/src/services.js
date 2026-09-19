const crypto = require("node:crypto");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(":");
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

function createServices(db) {
  const seed = db.transaction(() => {
    if (db.prepare("SELECT COUNT(*) AS count FROM users").get().count === 0) {
      db.prepare(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)"
      ).run("admin", hashPassword("admin123"), "admin");
    }

    if (db.prepare("SELECT COUNT(*) AS count FROM menu_items").get().count === 0) {
      const insert = db.prepare(
        "INSERT INTO menu_items (name, price_cents) VALUES (?, ?)"
      );
      insert.run("Burger", 850);
      insert.run("Pizza", 1200);
      insert.run("Coffee", 300);
    }
  });
  seed();

  return {
    auth: {
      login(username, password) {
        const user = db.prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?")
          .get(username);
        if (!user || !verifyPassword(password, user.password_hash)) {
          throw new Error("Invalid username or password");
        }
        return { id: user.id, username: user.username, role: user.role };
      }
    },

    menu: {
      list() {
        return db.prepare(
          "SELECT id, name, price_cents AS priceCents, active FROM menu_items ORDER BY name"
        ).all();
      },
      create(name, priceCents) {
        const result = db.prepare(
          "INSERT INTO menu_items (name, price_cents) VALUES (?, ?)"
        ).run(name, priceCents);
        return db.prepare(
          "SELECT id, name, price_cents AS priceCents, active FROM menu_items WHERE id = ?"
        ).get(result.lastInsertRowid);
      }
    },

    orders: {
      list() {
        return db.prepare(`
          SELECT
            o.id,
            o.status,
            o.total_cents AS totalCents,
            o.created_at AS createdAt,
            u.username
          FROM orders o
          JOIN users u ON u.id = o.user_id
          ORDER BY o.id DESC
        `).all();
      },

      create(userId, items) {
        const getMenu = db.prepare(
          "SELECT id, price_cents AS priceCents FROM menu_items WHERE id = ? AND active = 1"
        );
        const insertOrder = db.prepare(
          "INSERT INTO orders (user_id, status, total_cents) VALUES (?, 'open', ?)"
        );
        const insertItem = db.prepare(`
          INSERT INTO order_items
            (order_id, menu_item_id, quantity, unit_price_cents)
          VALUES (?, ?, ?, ?)
        `);

        return db.transaction(() => {
          let total = 0;
          const resolved = [];

          for (const item of items) {
            const menu = getMenu.get(item.menuItemId);
            if (!menu) throw new Error(`Menu item ${item.menuItemId} not found`);
            if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
              throw new Error("Quantity must be a positive integer");
            }
            total += menu.priceCents * item.quantity;
            resolved.push({ ...item, priceCents: menu.priceCents });
          }

          const order = insertOrder.run(userId, total);

          for (const item of resolved) {
            insertItem.run(
              order.lastInsertRowid,
              item.menuItemId,
              item.quantity,
              item.priceCents
            );
          }

          return {
            id: Number(order.lastInsertRowid),
            totalCents: total,
            status: "open"
          };
        })();
      },

      setStatus(id, status) {
        if (!["open", "paid", "cancelled"].includes(status)) {
          throw new Error("Invalid order status");
        }
        db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
      }
    },

    dashboard: {
      today() {
        return db.prepare(`
          SELECT
            COUNT(*) AS orderCount,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN total_cents ELSE 0 END), 0) AS revenueCents
          FROM orders
          WHERE date(created_at, 'localtime') = date('now', 'localtime')
        `).get();
      }
    }
  };
}

module.exports = { createServices };
