# Local Desktop Mode

## Target architecture

```text
Electron main
  |
  +-- local service
  |     |
  |     +-- auth
  |     +-- menu
  |     +-- orders
  |     +-- dashboard
  |
  +-- SQLite
  |
  +-- updater
  |
  +-- OS integration

Electron renderer
  |
  +-- React
```

## IPC

Expose a small allow-list through preload:

```text
window.api.auth.login()
window.api.menu.list()
window.api.orders.create()
window.api.app.checkForUpdates()
```

Do not expose:

```text
window.node
window.fs
window.require
```

to the renderer.

## Data location

Store user data in the OS application-data directory, not beside the executable.

Conceptually:

```text
AppData/
  RestaurantOrderManager/
    data/
      app.sqlite
    backups/
    logs/
    settings.json
```

This allows application updates to replace application files without replacing customer data.

## First launch

On first launch:

1. create application-data directory
2. create/open SQLite database
3. run migrations
4. create initial admin if no users exist
5. show setup screen
6. start normal application
