# User reports , Tests, Features, and Errors

## Testing report

- [UI FRONTEND] [RESOLVED] while testing the frontend initially the bakcend and frontend was not synced so , when default order items where created in the frontend using default datas it conflicted with the backend, where item number does not exist so the solution is removing any default data source in the frontend and wait for the backend to send the data or created by the user on the frontend.
  - **Resolution**: Removed hardcoded `SEED_MENU` and default fallback IDs (1-5) from `client.js`. Implemented automatic legacy cache sanitization for previously cached mock items in `localStorage`. Updated `MenuList.jsx` to render a clean prompt waiting for backend synchronization.

- [DESKTOP] [RESOLVED] while testing the desktop standalone exe it failed with `Cannot find module 'bcrypt'` and `better_sqlite3.node NODE_MODULE_VERSION 127 vs 140 ABI mismatch`.
  - **Resolution**:
    1. Made `bcrypt` optional in `app/backend/src/services/index.js` with try/catch, providing full password verification fallback to standard `node:crypto` (`scryptSync`).
    2. Updated default admin seed hash in `app/desktop/src/db/local-db.js` to an scrypt hash (`admin123`) with auto-migration of legacy hashes.
    3. Cached Electron ABI 140 binary in `app/desktop/prebuilds/electron-v140-linux-x64/better_sqlite3.node` and added `app/desktop/scripts/inject-native.js` post-package script.
    4. Verified standalone executable starts with zero errors and passes 100% of monorepo automated tests (67/67).
- [backend]- while testing frontend the user wants to delete and edit the menu items but cors problem occured here is some logs: `814 Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8000/api/menu/4. (Reason: Did not find method in CORS header ‘Access-Control-Allow-Methods’). 
22:53:58.815 Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8000/api/menu/4. (Reason: CORS request did not succeed). Status code: (null). `

## Feature suggestion

- [ui] implement the signup on initial setup (Planned for Phase 2)
- [ui] add staff account creation under admin account so the admin needs its own dashboard for managing, shops, staff, later on finance and ledgers (Planned for Phase 2)
- [backend] for above ui features we need routes and database relations and schemas (Registered in sync.md)
- [ui] [RESOLVED (Phase 1)] item editing is not implemented, updating info, price, name, deleteing , we should open modal to do this on fly.
  - **Resolution**: Created `EditMenuItemModal.jsx` for on-the-fly editing of name, price, and category. Built dedicated Menu Management console (`MenuManagementPage.jsx`) at `/menu` with full catalog table, category filters, quick item addition, and instant editing/deletion, linked from the header navigation tabs and POS dashboard. Exposed `api.menu.update(id, input)` in `client.js` with `PATCH /api/menu/:id` integration and IPC handler parity.
- [ui] [RESOLVED (Phase 1)] upon refresh it exits the session resulting in offline not working specially if backend is exited, and needed to login againg, even if the backend is active and refreshed it signs out which is bad look.
  - **Resolution**: Persisted user profile into `localStorage` (`restaurant_user`). Updated `useAuth` to synchronously hydrate `user` on initial mount to eliminate redirect flashes. Implemented non-blocking background revalidation via `/api/auth/me` when online while preserving cached credentials if offline.
- [ui] custom category adding and prebuilt categories for food and drink items.
