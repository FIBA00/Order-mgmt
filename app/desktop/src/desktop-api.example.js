// This file is intentionally redundant.
// It shows the shape of the bridge without needing to inspect Electron internals.
//
// Renderer code:
//   window.desktopAPI.orders.list()
//
// Actual bridge:
//   preload.js -> contextBridge -> ipcRenderer.invoke()
//   main.js    -> ipcMain.handle()
//
// Never expose ipcRenderer itself to React.
