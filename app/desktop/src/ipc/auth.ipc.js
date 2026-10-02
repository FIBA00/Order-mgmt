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
        password: z.string().min(1)
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
}

module.exports = {
  registerAuthIpc,
  requireAuth,
  requireAdmin
};
