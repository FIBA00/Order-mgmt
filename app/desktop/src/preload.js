const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  auth: {
    login: (credentials) => ipcRenderer.invoke("auth:login", credentials),
    logout: () => ipcRenderer.invoke("auth:logout"),
    me: () => ipcRenderer.invoke("auth:me"),
    listUsers: () => ipcRenderer.invoke("auth:list-users"),
    createUser: (input) => ipcRenderer.invoke("auth:create-user", input),
    deleteUser: (id) => ipcRenderer.invoke("auth:delete-user", id),
  },

  menu: {
    list: () => ipcRenderer.invoke("menu:list"),
    create: (input) => ipcRenderer.invoke("menu:create", input),
    update: (id, data) => ipcRenderer.invoke("menu:update", { id, ...data }),
    delete: (id) => ipcRenderer.invoke("menu:delete", id),
  },

  orders: {
    list: () => ipcRenderer.invoke("orders:list"),
    get: (id) => ipcRenderer.invoke("orders:get", id),
    create: (input) => ipcRenderer.invoke("orders:create", input),
    setStatus: (idOrInput, maybeStatus) => {
      const payload =
        typeof idOrInput === "object"
          ? idOrInput
          : { id: idOrInput, status: maybeStatus };
      return ipcRenderer.invoke("orders:set-status", payload);
    },
  },

  dashboard: {
    today: () => ipcRenderer.invoke("dashboard:today"),
  },

  printer: {
    list: () => ipcRenderer.invoke("printer:list"),
    print: (options) => ipcRenderer.invoke("printer:print", options),
  },

  app: {
    info: () => ipcRenderer.invoke("app:get-info"),
    checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates"),
    downloadUpdate: () => ipcRenderer.invoke("app:download-update"),
    installUpdate: () => ipcRenderer.invoke("app:install-update"),
    uploadLogs: (targetUrl) => ipcRenderer.invoke("app:upload-logs", targetUrl),
    onUpdateStatus: (callback) => {
      const handler = (_event, data) => callback(data);
      ipcRenderer.on("updater:status", handler);
      return () => ipcRenderer.removeListener("updater:status", handler);
    },
  },

  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  },
});
