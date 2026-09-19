# Packaging

## Development

```text
npm run dev
```

## Production

Conceptually:

```text
React build
   |
Electron package
   |
Electron Forge
   |
installer
```

Electron Forge is the recommended learning path in this project because it covers packaging and distribution.

## Windows target

The primary learning target is Windows because many small-business desktop clients use it.

Expected artifact:

```text
RestaurantOrderManager-Setup.exe
```

Later add:

```text
macOS .dmg
Linux .deb / AppImage
```

## Installer responsibilities

The installer should:

- choose installation directory
- create shortcuts
- install application
- register uninstaller
- preserve application-data directory
- optionally launch after installation

## Important

The installer is not the database.

The installer contains application binaries.

User data belongs in the OS application-data directory.
