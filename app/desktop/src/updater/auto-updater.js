const { dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const { getMainWindow } = require("../window/main-window.js");

function broadcastStatus(status, meta = {}) {
  const win = getMainWindow();
  if (win && !win.isDestroyed() && win.webContents) {
    win.webContents.send("updater:status", { status, ...meta });
  }
}

function configureAutoUpdater() {
  autoUpdater.autoDownload = false;

  autoUpdater.on("checking-for-update", () => {
    broadcastStatus("checking");
  });

  autoUpdater.on("update-not-available", () => {
    broadcastStatus("not-available");
  });

  autoUpdater.on("update-available", (info) => {
    broadcastStatus("available", { version: info?.version });
    const win = getMainWindow();
    if (win) {
      dialog
        .showMessageBox(win, {
          type: "info",
          title: "Update available",
          message: `A new version (${info?.version || "update"}) is available. Download it now?`,
          buttons: ["Download", "Later"],
        })
        .then(({ response }) => {
          if (response === 0) autoUpdater.downloadUpdate();
        });
    }
  });

  autoUpdater.on("download-progress", (progress) => {
    broadcastStatus("downloading", {
      percent: Math.round(progress.percent || 0),
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    broadcastStatus("downloaded", { version: info?.version });
    const win = getMainWindow();
    if (win) {
      dialog
        .showMessageBox(win, {
          type: "info",
          title: "Update ready",
          message: "The update is downloaded. Restart and install it now?",
          buttons: ["Restart & Install", "Later"],
        })
        .then(({ response }) => {
          if (response === 0) autoUpdater.quitAndInstall();
        });
    }
  });

  autoUpdater.on("error", (error) => {
    broadcastStatus("error", { message: error.message });
    console.error("Auto update error:", error);
  });
}

function checkForUpdatesIfPackaged(isPackaged) {
  if (isPackaged) {
    autoUpdater.checkForUpdates().catch((error) => {
      broadcastStatus("error", { message: error.message });
      console.error("Initial update check failed:", error.message);
    });
  }
}

module.exports = {
  configureAutoUpdater,
  checkForUpdatesIfPackaged,
};
