const path = require("node:path");
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { autoUpdater } = require("electron-updater");
const { z } = require("zod");

const { openDatabase } = require("../../backend/src/db");
const { createServices } = require("../../backend/src/services");

let mainWindow;
let services;
let db;

// The renderer is untrusted content (same as a browser tab). Unlike the HTTP
// API, IPC has no bearer token, so the main process itself tracks who is
// logged in and every handler (other than auth:login) must go through
// requireAuth()/requireAdmin() below. Never trust a userId/role sent from
// the renderer.
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

function getDatabasePath() {
  return path.join(app.getPath("userData"), "data", "restaurant.sqlite");
}

function createLocalServices() {
  db = openDatabase(getDatabasePath());
  services = createServices(db);
}

function registerIpc() {
  ipcMain.handle("auth:login", (_event, credentials) => {
    const input = z.object({
      username: z.string().min(1),
      password: z.string().min(1)
    }).parse(credentials);

    const user = services.auth.login(input.username, input.password);
    currentUser = user;
    return user;
  });

  ipcMain.handle("auth:logout", () => {
    currentUser = null;
    return { ok: true };
  });

  ipcMain.handle("auth:me", () => requireAuth());

  ipcMain.handle("menu:list", () => {
    requireAuth();
    return services.menu.list();
  });

  ipcMain.handle("menu:create", (_event, input) => {
    requireAdmin();
    const parsed = z.object({
      name: z.string().min(1),
      priceCents: z.number().int().nonnegative()
    }).parse(input);
    return services.menu.create(parsed.name, parsed.priceCents);
  });

  ipcMain.handle("orders:list", () => {
    requireAuth();
    return services.orders.list();
  });

  ipcMain.handle("orders:create", (_event, input) => {
    const user = requireAuth();
    const parsed = z.object({
      items: z.array(z.object({
        menuItemId: z.number().int(),
        quantity: z.number().int().positive()
      })).min(1)
    }).parse(input);

    // userId always comes from the tracked session, never from the renderer.
    return services.orders.create(user.id, parsed.items);
  });

  ipcMain.handle("orders:set-status", (_event, input) => {
    requireAuth();
    const parsed = z.object({
      id: z.number().int(),
      status: z.enum(["open", "paid", "cancelled"])
    }).parse(input);
    services.orders.setStatus(parsed.id, parsed.status);
    return { ok: true };
  });

  ipcMain.handle("dashboard:today", () => {
    requireAuth();
    return services.dashboard.today();
  });

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
