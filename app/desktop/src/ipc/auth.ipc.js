const { ipcMain } = require("electron");
const { z } = require("zod");

let currentUser = null;

function requireAuth() {
  if (!currentUser) {
    throw new Error("Authentication required");
  }
  return currentUser;
}

function requireAdmin() {
  const user = requireAuth();
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

function registerAuthIpc(services) {
  ipcMain.handle("auth:login", (_event, credentials) => {
    const input = z
      .object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
      .parse(credentials);

    const user = services.auth.login(input.username, input.password);
    currentUser = user;
    return user;
  });

  ipcMain.handle("auth:logout", () => {
    currentUser = null;
    return { ok: true };
  });

  ipcMain.handle("auth:me", () => requireAuth());

  ipcMain.handle("auth:list-users", () => {
    requireAdmin();
    return services.auth.listUsers();
  });

  ipcMain.handle("auth:create-user", (_event, data) => {
    const input = z
      .object({
        username: z.string().min(1),
        password: z.string().min(6),
        role: z.enum(["admin", "cashier"]).optional(),
      })
      .parse(data);

    if (currentUser) {
      requireAdmin();
    }
    return services.auth.createUser(input.username, input.password, input.role || "cashier");
  });

  ipcMain.handle("auth:delete-user", (_event, id) => {
    const admin = requireAdmin();
    if (admin.id === Number(id)) {
      throw new Error("Cannot delete your own admin account");
    }
    return services.auth.deleteUser(Number(id));
  });
}

module.exports = {
  registerAuthIpc,
  requireAuth,
  requireAdmin,
};
