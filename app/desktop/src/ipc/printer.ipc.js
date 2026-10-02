const { ipcMain } = require("electron");
const { getMainWindow } = require("../window/main-window.js");

function registerPrinterIpc() {
  ipcMain.handle("printer:list", async () => {
    const win = getMainWindow();
    if (!win || !win.webContents) return [];
    try {
      return await win.webContents.getPrintersAsync();
    } catch {
      return [];
    }
  });

  ipcMain.handle("printer:print", async (_event, options = {}) => {
    const win = getMainWindow();
    if (!win || !win.webContents) {
      throw new Error("Application window is not available for printing");
    }

    return new Promise((resolve, reject) => {
      win.webContents.print(
        {
          silent: Boolean(options.silent),
          printBackground: options.printBackground !== false,
          deviceName: options.deviceName || ""
        },
        (success, failureReason) => {
          if (success) {
            resolve({ ok: true });
          } else {
            resolve({ ok: false, error: failureReason || "Print operation cancelled" });
          }
        }
      );
    });
  });
}

module.exports = { registerPrinterIpc };
