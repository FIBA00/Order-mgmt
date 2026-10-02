const { ipcMain } = require("electron");
const { requireAuth } = require("./auth.ipc.js");

function registerDashboardIpc(services) {
  ipcMain.handle("dashboard:today", () => {
    requireAuth();
    return services.dashboard.today();
  });
}

module.exports = { registerDashboardIpc };
