# Packaging — Actual Implementation

This project uses **electron-builder** for the executable/installer/update pipeline because it makes the complete private-app flow easy to inspect:

```text
React build
   |
Electron application
   |
electron-builder
   |
NSIS installer
   |
signed release
```

Electron itself does not bundle a complete distribution system. Official Electron documentation describes packaging, signing, publishing and updating as separate distribution stages.

## Files to inspect

```text
apps/desktop/package.json
apps/desktop/src/main.js
.github/workflows/release.yml
```

## Windows installer

The configuration uses:

```json
"win": {
  "target": [
    {
      "target": "nsis",
      "arch": ["x64"]
    }
  ]
}
```

and:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true
}
```

So the user gets an actual installation wizard rather than merely an unpacked executable.

## Build

From the repository root:

```bash
npm install
npm run build
npm run desktop:dist
```

or:

```bash
npm run build --workspace apps/frontend
npm run dist --workspace apps/desktop
```

The resulting installer appears under:

```text
apps/desktop/dist/
```

## Important

Build on the target platform for the first learning cycle.

Start with:

```text
Windows x64
```

Then learn cross-platform builds/CI later.
