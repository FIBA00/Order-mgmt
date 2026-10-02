const { ipcMain } = require("electron");
const { z } = require("zod");
const { requireAuth, requireAdmin } = require("./auth.ipc.js");

function registerMenuIpc(services) {
  ipcMain.handle("menu:list", () => {
    requireAuth();
    return services.menu.list();
  });

  ipcMain.handle("menu:create", (_event, input) => {
    requireAdmin();
    const parsed = z
      .object({
        name: z.string().min(1),
        priceCents: z.number().int().nonnegative(),
      })
      .parse(input);
    return services.menu.create(parsed.name, parsed.priceCents);
  });

  ipcMain.handle("menu:update", (_event, { id, ...data }) => {
    requireAdmin();
    const parsedId = z.number().int().positive().parse(Number(id));
    return services.menu.update(parsedId, data);
  });

  ipcMain.handle("menu:delete", (_event, id) => {
    requireAdmin();
    const parsedId = z.number().int().positive().parse(Number(id));
    services.menu.delete(parsedId);
    return { ok: true, id: parsedId };
  });
}

module.exports = { registerMenuIpc };
