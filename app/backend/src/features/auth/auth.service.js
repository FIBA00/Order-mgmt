const crypto = require("node:crypto");
const { eq } = require("drizzle-orm");
const { users } = require("../../db/schema");
const { createError } = require("../../middleware/errors");

function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(":");
  const actual = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(actual, "hex"),
    Buffer.from(expected, "hex"),
  );
}

function createAuthService(db) {
  async function login(username, password) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw createError("Invalid username or password", 401);
    }

    return { id: user.id, username: user.username, role: user.role };
  }

  return { login };
}

module.exports = { createAuthService };
