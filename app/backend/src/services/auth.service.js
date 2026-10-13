import crypto from "node:crypto";
import { createRequire } from "node:module";
import { eq, asc } from "drizzle-orm";
import { sqliteSchema } from "../database/index.js";

const cjsRequire = createRequire(import.meta.url);

let bcrypt = null;
try {
  bcrypt = cjsRequire("bcrypt");
} catch {
  // bcrypt not available in standalone desktop bundle; fallback to node:crypto scrypt
}

export function verifyPassword(password, stored) {
  if (!password || !stored) return false;

  if (
    stored.startsWith("$2a$") ||
    stored.startsWith("$2b$") ||
    stored.startsWith("$2y$")
  ) {
    if (bcrypt && typeof bcrypt.compareSync === "function") {
      try {
        return bcrypt.compareSync(password, stored);
      } catch {
        return false;
      }
    }
    return false;
  }

  if (stored.includes(":")) {
    const [salt, expected] = stored.split(":");
    const actual = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(actual, "hex"),
      Buffer.from(expected, "hex"),
    );
  }

  return false;
}

export function hashPasswordSync(password) {
  if (bcrypt && typeof bcrypt.hashSync === "function") {
    try {
      return bcrypt.hashSync(password, 10);
    } catch {
      // fallback to scrypt
    }
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function createAuthService(db) {
  const schema = db.schema || sqliteSchema;
  const { users } = schema;

  return {
    login(username, password) {
      const user = db
        .select({
          id: users.id,
          username: users.username,
          passwordHash: users.passwordHash,
          role: users.role,
        })
        .from(users)
        .where(eq(users.username, username))
        .get();

      if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new Error("Invalid username or password");
      }
      return { id: user.id, username: user.username, role: user.role };
    },

    listUsers() {
      return db
        .select({
          id: users.id,
          username: users.username,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(asc(users.id))
        .all();
    },

    createUser(username, password, role = "cashier") {
      const existing = db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .get();

      if (existing) {
        throw new Error("Username already taken");
      }

      const passwordHash = hashPasswordSync(password);
      const [created] = db
        .insert(users)
        .values({
          username,
          passwordHash,
          role,
        })
        .returning({
          id: users.id,
          username: users.username,
          role: users.role,
        })
        .all();

      return {
        id: created.id,
        username: created.username,
        role: created.role,
      };
    },

    deleteUser(id) {
      return db.delete(users).where(eq(users.id, id)).run();
    },
  };
}
