# Industry Notes

## Electron

Electron's official documentation separates the lifecycle into development, packaging, publishing, and updating. 
Electron Forge is the main official packaging/distribution path.

## SQLite

SQLite is an embedded, serverless, zero-configuration database. 
It is a strong fit for a single-machine offline application.

## Signing

Code signing is part of desktop distribution, not an optional decoration.
 Public trust requires real certificates; development self-signing is useful only for learning.

## Updating

Updates require a release artifact and a trusted update mechanism. 
The application should continue to operate when an update endpoint is unreachable.

## Architecture decision for this project

We intentionally choose:

```text
React
+
Electron
+
Node service layer
+
SQLite
+
Electron Forge
```

Then we will later compare the same product against Tauri.

## Why not over-engineer it?

The purpose is to learn desktop engineering.

The restaurant domain should remain simple enough that the following remain visible:

```text
installation
filesystem
database lifecycle
IPC
packaging
signing
updates
release automation
```
