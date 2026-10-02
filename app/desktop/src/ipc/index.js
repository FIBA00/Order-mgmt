const { registerAuthIpc } = require("./auth.ipc.js");
const { registerMenuIpc } = require("./menu.ipc.js");
const { registerOrdersIpc } = require("./orders.ipc.js");
const { registerDashboardIpc } = require("./dashboard.ipc.js");
const { registerAppIpc } = require("./app.ipc.js");
const { registerPrinterIpc } = require("./printer.ipc.js");

function registerAllIpc(services) {
  registerAuthIpc(services);
  registerMenuIpc(services);
  registerOrdersIpc(services);
  registerDashboardIpc(services);
  registerAppIpc();
  registerPrinterIpc();
}

module.exports = { registerAllIpc };
