const path = require("node:path");
const { app, BrowserWindow, shell, Menu } = require("electron");
const { windowConfig, getFrontendIndexPath } = require("../config/app.config.js");

let mainWindow = null;

function setupApplicationMenu(win) {
  const isDev = !app.isPackaged || Boolean(process.env.VITE_DEV_SERVER_URL);

  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Print Ticket / Receipt",
          accelerator: "CmdOrCtrl+P",
          click: () => {
            if (win && win.webContents) {
              win.webContents.print({ silent: false, printBackground: true });
            }
          }
        },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        {
          label: "Toggle Fullscreen (POS Mode)",
          accelerator: "F11",
          click: () => {
            if (win) {
              win.setFullScreen(!win.isFullScreen());
            }
          }
        },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        ...(isDev
          ? [
              { type: "separator" },
              {
                label: "Toggle Developer Tools",
                accelerator: "F12",
                click: () => win && win.webContents.toggleDevTools()
              }
            ]
          : [])
      ]
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "close" }]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    ...windowConfig,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  setupApplicationMenu(mainWindow);

  const devUrl = process.env.VITE_DEV_SERVER_URL;

  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(getFrontendIndexPath(app.isPackaged));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("render-process-gone", (event, details) => {
    console.error("Renderer process crashed or was terminated:", details);
  });

  mainWindow.webContents.on("unresponsive", () => {
    console.warn("Renderer window became unresponsive");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}

function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createMainWindow,
  getMainWindow
};
