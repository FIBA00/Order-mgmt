# Actual Desktop Code Tour

This file exists because the desktop layer should not remain theoretical.

## 1. Electron entry point

Open:

```text
apps/desktop/src/main.js
```

This is the desktop application's privileged process.

It:

- opens SQLite
- creates services
- registers IPC handlers
- creates the BrowserWindow
- loads React
- configures auto-updates
- closes the database on exit

## 2. Preload

Open:

```text
apps/desktop/src/preload.js
```

This is the security boundary.

React receives a tiny API:

```js
window.desktopAPI.orders.list()
```

It does not receive:

```js
require
fs
ipcRenderer
process
```

Electron recommends context isolation and a narrow `contextBridge` API for this pattern. See the official process model, context isolation, and IPC documentation.

## 3. Database location

Look at:

```js
app.getPath("userData")
```

The executable is not the data directory.

## 4. Local backend

The desktop app imports:

```js
../../backend/src/db
../../backend/src/services
```

This is intentional.

We are reusing the business/data layer without starting an HTTP server.

That gives us:

```text
SaaS:
HTTP -> Express -> services -> database

Desktop:
IPC -> services -> database
```

The business logic remains the same.

## 5. Packaging

Open:

```text
apps/desktop/package.json
```

Look at:

```json
"build": {
  "appId": "...",
  "win": {
    "target": [{"target": "nsis"}]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

This is the installer configuration.

## 6. Update mechanism

Look at:

```js
autoUpdater.checkForUpdates()
autoUpdater.downloadUpdate()
autoUpdater.quitAndInstall()
```

The update code is intentionally non-blocking.

If the internet is unavailable, the application continues.

## 7. CI

Open:

```text
.github/workflows/release.yml
```

A Git tag starts a release build.

The important lesson is that the production signing credentials belong in GitHub Actions secrets, not in Git.

## 8. One important limitation

This starter demonstrates the architecture and real code, but production release signing still requires your own publisher credentials/certificate. No project can safely contain a real private signing key.

Likewise, GitHub publishing requires your own repository and token.
