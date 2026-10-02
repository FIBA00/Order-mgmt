const { app, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");

function registerAppIpc() {
  ipcMain.handle("app:get-info", () => ({
    version: app.getVersion(),
    userDataPath: app.getPath("userData"),
    isPackaged: app.isPackaged
  }));

  ipcMain.handle("app:check-for-updates", async () => {
    if (!app.isPackaged) {
      return { status: "development" };
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        status: result?.updateInfo?.version
          ? "update-check-complete"
          : "no-update"
      };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  });
}

module.exports = { registerAppIpc };
