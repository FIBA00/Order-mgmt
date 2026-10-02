const { app, BrowserWindow, crashReporter } = require("electron");
const { initFileLogger } = require("./logger.js");
const { getBackendSrcDir, getDatabasePath } = require("./config/app.config.js");
const { initLocalDatabase } = require("./db/local-db.js");
const { registerAllIpc } = require("./ipc/index.js");
const { createMainWindow } = require("./window/main-window.js");
const {
  configureAutoUpdater,
  checkForUpdatesIfPackaged,
} = require("./updater/auto-updater.js");

// Initialize persistent home directory logging
initFileLogger(app);

// Enable local minidump recording
try {
  crashReporter.start({ submitURL: "", uploadToServer: false });
} catch {}

let dbInstance = null;

app
  .whenReady()
  .then(() => {
    // Initialize local SQLite database and services with first-run auto-seeding
    const backendSrcDir = getBackendSrcDir(app.isPackaged);
    const dbPath = getDatabasePath(app.getPath("userData"));
    const { db, services } = initLocalDatabase(backendSrcDir, dbPath);
    dbInstance = db;

    // Register domain IPC handlers
    registerAllIpc(services);

    // Create UI Window and updater
    createMainWindow();
    configureAutoUpdater();
    checkForUpdatesIfPackaged(app.isPackaged);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  })
  .catch((err) => {
    console.error("Electron startup error:", err);
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (dbInstance) {
    dbInstance.close();
  }
});
