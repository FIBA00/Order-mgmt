# Desktop Specialist Report

## Current State

The desktop application (`@restaurant/desktop`) has been completely restructured into a modular, production-ready architecture with separation of concerns. Packaging succeeds fully offline utilizing the existing cached Electron binary under `~/.cache/electron`.

### 1. Offline Packaging & Cache Optimization

- **Zero Network Binary Downloads**: Configured `ELECTRON_CACHE=/home/fraold/.cache/electron` and set `"npmRebuild": false` in `app/desktop/package.json`.
- **Prebuilt Native Loading**: Electron v39.8.10 directly loads the existing `better-sqlite3` native addon from `node_modules` without triggering remote node-gyp header downloads.
- **Standalone Packaging**: Successfully packages into `app/desktop/dist/linux-unpacked/restaurant-order-manager` with full ASAR bundling and unpacked native libraries (`app.asar.unpacked/node_modules/better-sqlite3`).

### 2. Modular Architecture & Separation of Concerns

The desktop codebase has been refactored into domain-segregated modules following industry standards:

- `src/main.js`: Concise, readable application orchestrator (~40 lines).
- `src/config/app.config.js`: Centralized path resolution for backend sources, frontend assets, database locations, and default window geometry.
- `src/db/local-db.js`: Local SQLite lifecycle management and **First-Run Auto-Seeder** (automatically inserts initial `admin` account with hashed credentials and seed menu items if tables are empty).
- `src/ipc/`: Domain-segregated IPC handlers:
  - `auth.ipc.js`: Authentication state, session tracking, and `requireAuth` / `requireAdmin` security guards.
  - `menu.ipc.js`: Menu operations (`menu:list`, `menu:create`, and added `menu:delete`).
  - `orders.ipc.js`: Order transactions (`orders:list`, `orders:create` with optional `note`, and `orders:set-status`).
  - `dashboard.ipc.js`: Daily analytics aggregation (`dashboard:today`).
  - `printer.ipc.js`: Native receipt printing (`printer:list`, `printer:print`) for thermal printers and order tickets.
  - `app.ipc.js`: Application metadata and update checking channels.
  - `index.js`: Master IPC dispatcher.
- `src/window/main-window.js`: BrowserWindow instantiation, dev URL vs packaged `dist/index.html` loading, POS application menu (F11 Fullscreen Kiosk mode, Ctrl+P Print Receipt, DevTools), and secure external link sandboxing.
- `src/updater/auto-updater.js`: Electron-updater event configuration and non-blocking update checking.
- `src/preload.js`: Context bridge exposing `window.desktopAPI` with complete IPC parity (`menu.delete`, `orders.setStatus`, `printer.list`, `printer.print`).

### 3. Automated Desktop Test Suite (`test/`)

- Implemented headless native test runner (`node --test 'test/**/*.test.js'`) with mock Electron lifecycle:
  - `test/helpers/mock-electron.js`: Mock IPC and app runtime for unit and integration testing.
  - `test/config.test.js` (4 tests): Path resolutions and window geometry validation.
  - `test/local-db.test.js` (5 tests): SQLite initialization, auto-seeder idempotency, and service operations.
  - `test/ipc.test.js` (9 tests): Security guards (`requireAuth`, `requireAdmin`), input validation, and IPC channels.
- **Test Results**: 21/21 tests pass in ~1.9s with 0 failures.

---

## Activity Log

| Date       | Task                                                          | Commit Message                                                                           |
| :--------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------- |
| 2026-10-02 | Initial Handoff & Desktop Codebase Audit                      | docs: desktop initial handoff audit and backlog report                                   |
| 2026-10-02 | Resolve packaging rebuild timeout using cached electron       | fix(desktop): configure npmRebuild false and use cached electron zip                     |
| 2026-10-02 | Implement first-run database seeder for admin & menu          | feat(desktop): auto-seed default admin and menu items on startup                         |
| 2026-10-02 | Achieve IPC API parity (menu:delete, orders note & setStatus) | feat(desktop): add menu delete and normalize orders IPC                                  |
| 2026-10-02 | Refactor desktop codebase into modular domain architecture    | refactor(desktop): modular architecture with domain IPC and db seeder                    |
| 2026-10-02 | Verify offline packaging into dist/linux-unpacked             | chore(desktop): verify successful packaging into standalone executable                   |
| 2026-10-02 | Implement native receipt printer IPC & POS shortcuts          | feat(desktop): add printer IPC channel and POS application menu shortcuts                |
| 2026-10-02 | Build automated test suite for desktop package                | test(desktop): add unit and IPC integration tests with mock electron                     |
| 2026-10-02 | Fix standalone exe bcrypt & sqlite ABI mismatch               | fix(desktop): resolve standalone bcrypt and sqlite ABI 140 errors                        |
| 2026-10-02 | Add persistent home directory logger & fix ELF corruption     | feat(desktop): persistent log to ~/.restaurant-order-manager.log and verified ELF binary |

---

## Local Backlog

- [x] **Task 1 (IPC Parity & Normalization)**: Added `menu:delete` handler in `src/ipc/menu.ipc.js`, exposed `menu.delete(id)` in `src/preload.js`, and normalized `orders.setStatus` signature.
- [x] **Task 2 (First-Run Database Seeder)**: Implemented auto-seeding routine in `src/db/local-db.js` that checks if `users` and `menu_items` are empty on startup and seeds default admin credentials (`admin` / `admin123`) and initial menu items.
- [x] **Task 3 (Builder Config & Local Cache Extraction)**: Configured `"npmRebuild": false` and `"linux": { "target": ["dir"] }` in `package.json` to leverage existing cached Electron binary under `~/.cache/electron` without downloading.
- [x] **Task 4 (Modular Architecture)**: Refactored monolithic `main.js` into clean domain modules (`config`, `db`, `ipc`, `window`, `updater`).
- [x] **Task 5 (Standalone Build Verification)**: Packaged application into `dist/linux-unpacked/restaurant-order-manager` with exit code 0.
- [x] **Task 6 (Native Printer IPC & POS Shortcuts)**: Created `src/ipc/printer.ipc.js`, exposed `desktopAPI.printer` in `preload.js`, and added F11 POS kiosk toggle and Ctrl+P print ticket shortcuts.
- [x] **Task 7 (Automated Desktop Test Suite)**: Implemented 21 unit/integration tests in `app/desktop/test/` verifying database initialization, seeder idempotency, config paths, and IPC auth guards.
- [x] **Task 8 (Standalone Startup & Native ABI Fix)**: Resolved `MODULE_NOT_FOUND: 'bcrypt'` and `ERR_DLOPEN_FAILED` (ABI 127 vs 140 for `better-sqlite3`) by safely degrading bcrypt to `node:crypto` (`scryptSync`), updating seed admin hash, caching Electron ABI 140 binary, and creating `scripts/inject-native.js` post-package injection.
- [x] **Task 9 (Home Directory Persistent Logging & ELF Integrity)**: Implemented `src/logger.js` saving crash logs, errors, and lifecycle events synchronously to `~/.restaurant-order-manager.log` with auto-rotation (5MB) and `crashReporter` minidumps; replaced corrupted prebuilt ELF binary with fully verified intact binary tested with `ldd` and live execution.
