# Actual Setup

## Requirements

- Node.js 22+
- npm
- Git
- Windows is the primary packaging target

## Install

```bash
npm install
```

## Run the ordinary local web version

Terminal 1:

```bash
npm run dev --workspace apps/backend
```

Terminal 2:

```bash
npm run dev --workspace apps/frontend
```

Open:

```text
http://localhost:5173
```

Login:

```text
admin
admin123
```

## Run desktop

First build React:

```bash
npm run build
```

Then:

```bash
npm run desktop:dev
```

Electron loads:

```text
apps/frontend/dist/
```

The desktop main process opens SQLite under Electron's `userData` directory and calls the same service layer directly.

## Build installer

```bash
npm run build
npm run desktop:package
```

The Windows installer will be in:

```text
apps/desktop/dist/
```

## Development update behavior

Auto-update is intentionally skipped when the app is not packaged.

For a real update test:

```text
1. create GitHub repository
2. replace YOUR_GITHUB_USERNAME
3. create v0.1.0 release
4. build/publish
5. install it
6. change version to v0.1.1
7. build/publish
8. launch v0.1.0
9. observe update check
```

Actual production code signing requires your own certificate/signing provider. Do not put a private key in this repository.
