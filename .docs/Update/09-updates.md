# Remote Updates — Actual Implementation

The project uses:

```text
electron-updater
+
electron-builder
+
GitHub Releases
```

The important code is in:

```text
apps/desktop/src/main.js
```

Look for:

```js
autoUpdater.checkForUpdates()
autoUpdater.downloadUpdate()
autoUpdater.quitAndInstall()
```

## Runtime flow

```text
Application starts
       |
       v
app.isPackaged?
       |
      yes
       |
       v
checkForUpdates()
       |
       +---- no internet ---> ignore error ---> continue app
       |
       +---- update exists
                    |
                    v
             ask user
                    |
                    v
             downloadUpdate()
                    |
                    v
            update-downloaded
                    |
                    v
             quitAndInstall()
```

## Release configuration

`apps/desktop/package.json` contains:

```json
"publish": [
  {
    "provider": "github",
    "owner": "YOUR_GITHUB_USERNAME",
    "repo": "restaurant-order-manager"
  }
]
```

Replace those values with your actual release repository.

## CI

`.github/workflows/release.yml` runs on:

```text
v0.1.0
v0.1.1
v0.2.0
...
```

tags.

The release build publishes artifacts to GitHub Releases.

electron-builder generates release metadata such as `latest.yml`, and `electron-updater` uses that metadata to discover updates. citeturn0search13

## Critical lesson

The update server is not the application backend.

The restaurant can continue using:

```text
Electron
SQLite
```

with no internet.

Internet is only needed when the user wants to receive a newer application version.
