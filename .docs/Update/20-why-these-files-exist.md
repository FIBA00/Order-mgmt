# Why These Files Exist

This is the part that was missing from the previous archive.

## `apps/desktop/src/main.js`

The actual desktop program.

If you have only built React/Express before, this is the first file to study carefully.

It owns privileged operations and the application's lifecycle.

## `apps/desktop/src/preload.js`

The bridge between React and Electron.

Think:

```text
React cannot touch Node directly.
        |
        v
preload exposes exactly what React is allowed to call.
        |
        v
main process performs the privileged operation.
```

Electron explicitly recommends this isolated preload/contextBridge pattern rather than exposing raw Electron APIs. citeturn0search0turn0search2turn0search3

## `apps/desktop/package.json`

This is where the application stops being "just JavaScript" and becomes a distributable desktop product.

It defines:

- app ID
- application name
- Windows target
- NSIS installer
- shortcuts
- publisher
- release configuration

## `.github/workflows/release.yml`

This is the bridge from:

```text
developer machine
```

to:

```text
release machine
```

It demonstrates where testing, building, signing and publishing belong.

## `apps/backend/src/services.js`

This is deliberately shared.

The same business operation can be called by:

```text
Express
```

or:

```text
Electron IPC
```

That is the key architecture lesson.

## `apps/backend/src/db.js`

This demonstrates actual desktop database lifecycle:

```text
open database
 -> migrate
 -> seed
 -> use
 -> close
```

## `electron-updater`

This is actual update code, not pseudocode.

The updater is initialized in the Electron main process because update installation is a desktop operation.

## `nsis`

This is the installation wizard.

It is not React.

React is the application UI.

NSIS is the Windows installer.

That distinction is one of the most important things to learn in this project.
