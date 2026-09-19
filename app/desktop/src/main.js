const path = require("node:path");
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");

const { openDatabase } = require("../../backend/src/db");
const { createServices } = require("../../backend/src/services");

let mainWindow;
let services;
let db;

function getDatabasePath() {
  return path.join(app.getPath("userData"), "data", "restaurant.sqlite");
}

function createLocalServices() {
  db = openDatabase(getDatabasePath());
  services = createServices(db);
}

function registerIpc() {
  ipcMain.handle("auth:login", (_event, credentials) => {
    return services.auth.login(credentials.username, credentials.password);
  });

  ipcMain.handle("menu:list", () => services.menu.list());

  ipcMain.handle("menu:create", (_event, input) => {
    return services.menu.create(input.name, input.priceCents);
  });

  ipcMain.handle("orders:list", () => services.orders.list());

  ipcMain.handle("orders:create", (_event, input) => {
    return services.orders.create(input.userId, input.items);
  });

  ipcMain.handle("orders:set-status", (_event, input) => {
    services.orders.setStatus(input.id, input.status);
    return { ok: true };
  });

  ipcMain.handle("dashboard:today", () => services.dashboard.today());

  ipcMain.handle("app:get-info", () => ({
    version: app.getVersion(),
    userDataPath: app.getPath("userData")
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../../frontend/dist/index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function configureUpdater() {
  autoUpdater.autoDownload = false;

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update available",
      message: "A new version is available. Download it now?"
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update ready",
      message: "The update is downloaded. Restart and install it now?"
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on("error", error => {
    console.error("Auto update error:", error);
  });
}

app.whenReady().then(() => {
  createLocalServices();
  registerIpc();
  createWindow();
  configureUpdater();

  if (app.isPackaged) {
    // Update checking is deliberately non-blocking.
    autoUpdater.checkForUpdates().catch(error => {
      console.error("Initial update check failed:", error.message);
    });
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  db?.close();
});
