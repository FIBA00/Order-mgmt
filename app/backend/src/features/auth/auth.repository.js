import { eq } from "drizzle-orm";

export function createAuthRepository({ db, schema }) {
  const { users } = schema;

  async function findByUsername(username) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user ?? null;
  }

  async function findById(id) {
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async function create({ username, passwordHash, role = "cashier" }) {
    const [user] = await db
      .insert(users)
      .values({
        username,
        passwordHash,
        role,
        createdAt: new Date(),
      })
      .returning({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      });

    return user;
  }

  async function findAll() {
    return db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.username);
  }

  async function deleteUser(id) {
    return db.delete(users).where(eq(users.id, id));
  }

  return {
    findByUsername,
    findById,
    findAll,
    deleteUser,
    create,
  };
}
