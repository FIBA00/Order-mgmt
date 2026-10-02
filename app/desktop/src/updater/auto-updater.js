const { dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const { getMainWindow } = require("../window/main-window.js");

function configureAutoUpdater() {
  autoUpdater.autoDownload = false;

  autoUpdater.on("update-available", () => {
    const win = getMainWindow();
    dialog
      .showMessageBox(win, {
        type: "info",
        title: "Update available",
        message: "A new version is available. Download it now?",
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.downloadUpdate();
      });
  });

  autoUpdater.on("update-downloaded", () => {
    const win = getMainWindow();
    dialog
      .showMessageBox(win, {
        type: "info",
        title: "Update ready",
        message: "The update is downloaded. Restart and install it now?",
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall();
      });
  });

  autoUpdater.on("error", (error) => {
    console.error("Auto update error:", error);
  });
}

function checkForUpdatesIfPackaged(isPackaged) {
  if (isPackaged) {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("Initial update check failed:", error.message);
    });
  }
}

module.exports = {
  configureAutoUpdater,
  checkForUpdatesIfPackaged,
};
