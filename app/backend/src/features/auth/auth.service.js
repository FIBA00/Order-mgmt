import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { users } from "../../database/models.js";
import { database } from "../../database/database.js";

function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(":");
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(expected, "hex"),
  );
}

export function AuthService() {
  async function login(username, password) {
    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw createError("Invalid username or password", 401);
    }

    return { id: user.id, username: user.username, role: user.role };
  }
  async function signup(username, password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;

    const [user] = await database
      .insert(users)
      .values({ username, passwordHash })
      .returning();

    if (!user) {
      throw createError("Failed to create user", 500);
    }

    return { id: user.id, username: user.username, role: user.role };
  }

  return { login, signup };
}
