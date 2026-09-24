const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  auth: {
    login: credentials => ipcRenderer.invoke("auth:login", credentials),
    logout: () => ipcRenderer.invoke("auth:logout"),
    me: () => ipcRenderer.invoke("auth:me")
  },

  menu: {
    list: () => ipcRenderer.invoke("menu:list"),
    create: input => ipcRenderer.invoke("menu:create", input)
  },

  orders: {
    list: () => ipcRenderer.invoke("orders:list"),
    create: input => ipcRenderer.invoke("orders:create", input),
    setStatus: input => ipcRenderer.invoke("orders:set-status", input)
  },

  dashboard: {
    today: () => ipcRenderer.invoke("dashboard:today")
  },

  app: {
    info: () => ipcRenderer.invoke("app:get-info"),
    checkForUpdates: () => ipcRenderer.invoke("app:check-for-updates")
  }
});
