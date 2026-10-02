const electronPath = require.resolve("electron");

function setupElectronMock() {
  const handlers = new Map();

  const mockIpcMain = {
    handle(channel, listener) {
      handlers.set(channel, listener);
    },
    removeHandler(channel) {
      handlers.delete(channel);
    }
  };

  const mockApp = {
    isPackaged: false,
    getVersion: () => "0.1.0",
    getPath: name => (name === "userData" ? "/tmp/test-desktop-userdata" : "/tmp")
  };

  require.cache[electronPath] = {
    id: electronPath,
    filename: electronPath,
    loaded: true,
    exports: {
      ipcMain: mockIpcMain,
      app: mockApp,
      BrowserWindow: class {},
      dialog: {},
      shell: { openExternal: () => {} }
    }
  };

  function invoke(channel, ...args) {
    const handler = handlers.get(channel);
    if (!handler) {
      throw new Error(`No IPC handler registered for channel: ${channel}`);
    }
    const mockEvent = { sender: {} };
    return handler(mockEvent, ...args);
  }

  function clearHandlers() {
    handlers.clear();
  }

  return {
    handlers,
    invoke,
    clearHandlers
  };
}

module.exports = { setupElectronMock };
