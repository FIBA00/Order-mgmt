import {
  hashPassword,
  comparePassword,
  generateToken,
} from "../../middlewares/auth.middleware.js";

export function createAuthService(repository) {
  async function login(username, password) {
    const user = await repository.findByUsername(username);
    if (!user) {
      const err = new Error("Invalid username or password");
      err.statusCode = 401;
      throw err;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      const err = new Error("Invalid username or password");
      err.statusCode = 401;
      throw err;
    }

    const userProfile = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    const token = generateToken(userProfile);

    return { user: userProfile, token };
  }

  async function signup(username, password, role = "cashier") {
    const existing = await repository.findByUsername(username);
    if (existing) {
      const err = new Error("Username already taken");
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await hashPassword(password);
    const user = await repository.create({
      username,
      passwordHash,
      role: role || "cashier",
    });

    const userProfile = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    const token = generateToken(userProfile);

    return { user: userProfile, token };
  }

  async function getProfile(id) {
    const user = await repository.findById(id);
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return user;
  }

  async function listStaff() {
    return repository.findAll();
  }

  async function deleteStaff(id) {
    const user = await repository.findById(id);
    if (!user) {
      const err = new Error("Staff member not found");
      err.statusCode = 404;
      throw err;
    }

    if (repository.hasOrders && (await repository.hasOrders(id))) {
      const err = new Error(
        "Cannot delete staff account with existing order history. Historical sales records must be preserved.",
      );
      err.statusCode = 409;
      throw err;
    }

    try {
      return await repository.deleteUser(id);
    } catch (err) {
      if (
        err.code === "SQLITE_CONSTRAINT_FOREIGNKEY" ||
        err.code === "23503" ||
        err.message?.includes("FOREIGN KEY")
      ) {
        const conflictErr = new Error(
          "Cannot delete staff account with existing order history. Historical sales records must be preserved.",
        );
        conflictErr.statusCode = 409;
        throw conflictErr;
      }
      throw err;
    }
  }

  return {
    login,
    signup,
    getProfile,
    listStaff,
    deleteStaff,
  };
}
