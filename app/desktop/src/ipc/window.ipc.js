const { ipcMain, BrowserWindow } = require("electron");

function getTargetWindow(event) {
  if (typeof BrowserWindow.fromWebContents === "function" && event && event.sender) {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) return win;
  }
  if (typeof BrowserWindow.getFocusedWindow === "function") {
    return BrowserWindow.getFocusedWindow();
  }
  return null;
}

function registerWindowIpc() {
  ipcMain.handle("window:minimize", (event) => {
    const win = getTargetWindow(event);
    if (win && typeof win.minimize === "function") {
      win.minimize();
    }
    return true;
  });

  ipcMain.handle("window:maximize", (event) => {
    const win = getTargetWindow(event);
    if (win) {
      if (typeof win.isMaximized === "function" && win.isMaximized()) {
        if (typeof win.unmaximize === "function") win.unmaximize();
      } else {
        if (typeof win.maximize === "function") win.maximize();
      }
      return typeof win.isMaximized === "function" ? win.isMaximized() : false;
    }
    return false;
  });

  ipcMain.handle("window:close", (event) => {
    const win = getTargetWindow(event);
    if (win && typeof win.close === "function") {
      win.close();
    }
    return true;
  });

  ipcMain.handle("window:is-maximized", (event) => {
    const win = getTargetWindow(event);
    return win && typeof win.isMaximized === "function" ? win.isMaximized() : false;
  });
}

module.exports = { registerWindowIpc };
