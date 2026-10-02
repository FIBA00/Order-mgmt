const { ipcMain } = require("electron");
const { z } = require("zod");
const { requireAuth } = require("./auth.ipc.js");

function registerOrdersIpc(services) {
  ipcMain.handle("orders:list", () => {
    requireAuth();
    return services.orders.list();
  });

  ipcMain.handle("orders:create", (_event, input) => {
    const user = requireAuth();
    const parsed = z
      .object({
        items: z
          .array(
            z.object({
              menuItemId: z.number().int(),
              quantity: z.number().int().positive()
            })
          )
          .min(1),
        note: z.string().optional()
      })
      .parse(input);

    return services.orders.create(user.id, parsed.items);
  });

  ipcMain.handle("orders:set-status", (_event, input) => {
    requireAuth();
    const parsed = z
      .object({
        id: z.number().int(),
        status: z.enum(["open", "paid", "cancelled"])
      })
      .parse(input);

    services.orders.setStatus(parsed.id, parsed.status);
    return { ok: true, id: parsed.id, status: parsed.status };
  });
}

module.exports = { registerOrdersIpc };
