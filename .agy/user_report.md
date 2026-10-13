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
- [backend] [RESOLVED] while testing frontend the user wants to delete and edit the menu items but cors problem occured here is some logs: `814 Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8000/api/menu/4. (Reason: Did not find method in CORS header ‘Access-Control-Allow-Methods’). 
22:53:58.815 Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:8000/api/menu/4. (Reason: CORS request did not succeed). Status code: (null). `
  - **Resolution**: Updated `app/backend/src/server.js` to include `DELETE` and `PUT` in `Access-Control-Allow-Methods` header and Express CORS middleware configuration (`methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]`).

- [DESKTOP] [RESOLVED] the app loaded successfully and did signed in success but the terminal shows this: `Error occurred in handler for 'auth:me': Error: Authentication required`
  - **Resolution**: Wrapped `desktopAPI.auth.me()` in a `try/catch` in `app/frontend/src/api/client.js`, safely returning `null` when no session is active instead of raising an unhandled rejection. Added `HashRouter` protocol detection for `file://` and configured `base: "./"` in `vite.config.js` to resolve the white blank screen on initial launch.
- [DESKTOP] [RESOLVED] while deleting the menu item this error occured: `Error occurred in handler for 'menu:delete': SqliteError: FOREIGN KEY constraint failed`
  - **Resolution**: Updated `services.menu.delete` in `app/backend/src/services/index.js` to catch `FOREIGN KEY` constraint errors when historical order items reference the menu item, automatically soft-deleting (`UPDATE menu_items SET active = 0 WHERE id = ?`) so historical records are preserved. Filtered `menu.list` query to only active items (`WHERE active = 1`).
- [DESKTOP] [RESOLVED] the desktop shouldnt be using any raw sql codes instead we should use orm . specially the code under src/service/ dir 
  - **Resolution**: Refactored `app/backend/src/services/index.js` and `app/desktop/src/db/local-db.js` to completely replace raw `db.prepare(...)` SQL queries with Drizzle ORM operations (`db.select()`, `db.insert()`, `db.update()`, `db.delete()`, `count()`, `eq()`, `desc()`, `asc()`, `sql`). Retained backward-compatible delegates on `openDatabase` for test runner lifecycles (`db.close()`, `db.prepare()`).
- [DESKTOP] [RESOLVED] we dont need boundared  window (decoration) that is applied by the system we should only use internal controls and rely on drag and move to resize and remove any decorations just the website as it is .
  - **Resolution**:
    1. Set `frame: false`, `titleBarStyle: "hidden"`, and `resizable: true` in `app/desktop/src/config/app.config.js` to remove native OS decorations and titlebar while enabling window edge/corner resizing.
    2. Implemented `app/desktop/src/ipc/window.ipc.js` handling `window:minimize`, `window:maximize`, `window:close`, and `window:is-maximized`, registered in IPC dispatcher and exposed in `preload.js` under `desktopAPI.window`.
    3. Created sleek, minimal `TitleBar.jsx` component mounted at the top of `AppRouter`, using `-webkit-app-region: drag` for window movement and `-webkit-app-region: no-drag` for internal control buttons (minimize, maximize/restore, close).
- [BACKEND] [RESOLVED] why do we have db/ dir in the src folder while we have database/ dir dedicated to choosing between postgres and sqlite database ? 
  - **Resolution**: Completely eliminated the redundant `app/backend/src/db/` directory and its nested `package.json`. Unified all database management under [`app/backend/src/database/index.js`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/backend/src/database/index.js) using standard ES modules, Drizzle ORM schemas, and automated Drizzle migrations (`drizzle-orm/better-sqlite3/migrator`) with zero raw SQL. Desktop now imports directly from `database/`.

- [FRONTEND] [RESOLVED] even though i updated the menu item category into predefined category and tried to write my custom category for given item the update is not working it says updated but not sent to backend.
  - **Resolution**:
    1. Added `category: text().notNull().default("Food")` to SQLite and PostgreSQL Drizzle schemas (`menu-items.js`). Updated `0000_wet_meltdown.sql` and snapshot metadata so fresh SQLite databases provision tables with `category` natively.
    2. Completely removed all raw SQL (`.prepare()`, `.exec()`, `ALTER TABLE`, `PRAGMA table_info`) from `openDatabase` and `database.js`. Both environments now rely 100% on Drizzle's official `migrateSqlite()` runner with zero raw SQL strings.
    3. Updated `menu.service.js` and `menu.repository.js` to persist and select `category` in `list()`, `create()`, and `update()`.
    4. Updated desktop IPC `menu:create` and `menu:update` in `menu.ipc.js` to accept and pass `category`.
    5. Enhanced `EditMenuItemModal.jsx` and `MenuManagementPage.jsx` with dedicated `isCustom` category state so switching between predefined categories and custom input works smoothly without input jumping or losing values.
- [FRONTEND] [RESOLVED] when the user is not admin the ui for editing and deleting menu item should be disabled, becuase currently even though the staffs have no admin rights they can still see edit and delete but cant perform instead of confusing them just disable the buttons or hide them if they are staff other than admin.
  - **Resolution**:
    1. In `MenuManagementPage.jsx`, added `const isAdmin = user?.role === "admin"`.
    2. Disabled "+ Add Menu Item" when `!isAdmin` with `disabled:opacity-40 disabled:cursor-not-allowed` and tooltip "Admin permission required".
    3. In the catalog table, disabled "✎ Edit" and "🗑 Delete" action buttons when `!isAdmin` (`disabled={!isAdmin}`) with clean disabled styling and "Admin permission required" tooltip to prevent staff confusion.
- [BACKEND] [RESOLVED] we need to break down contents of services/index.js into their own files becuase separation of concern in this files is not looking good. we have huge code different domain and tasks.
  - **Resolution**:
    1. Modularized domain services into separate dedicated files:
       - `app/backend/src/services/auth.service.js`: Authentication (`login`, `listUsers`, `createUser`, `deleteUser`) and password hashing/verification (`verifyPassword`, `hashPasswordSync`).
       - `app/backend/src/services/menu.service.js`: Menu catalog operations (`list`, `create`, `update`, `delete` with foreign key soft-delete).
       - `app/backend/src/services/orders.service.js`: Order lifecycle (`list`, `create`, `setStatus`).
       - `app/backend/src/services/dashboard.service.js`: Reporting metrics (`today`).
    2. Converted `app/backend/src/services/index.js` into a clean aggregator maintaining 100% backward compatibility for Electron IPC and test harnesses.
- [BACKEND] - When deleting staff member in admin mode this failure occurs, ```GET /api/auth/users 304 8.330 ms - -
OPTIONS /api/auth/users/1 204 1.062 ms - -
DELETE /api/auth/users/1 500 9.315 ms - 1258
SqliteError: FOREIGN KEY constraint failed
    at PreparedQuery.run (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/better-sqlite3/session.js:72:22)
    at QueryPromise.resultCb (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/session.js:119:64)
    at QueryPromise.execute (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/session.js:13:17)
    at QueryPromise.then (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/query-promise.js:21:17)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
DELETE /api/auth/users/1 500 12.730 ms - 1258
SqliteError: FOREIGN KEY constraint failed
    at PreparedQuery.run (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/better-sqlite3/session.js:72:22)
    at QueryPromise.resultCb (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/session.js:119:64)
    at QueryPromise.execute (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/session.js:13:17)
    at QueryPromise.then (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/query-promise.js:21:17)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

 ```

- [BACKEND] - menu item deleting also failed ```  /api/menu 200 3.312 ms - 375
OPTIONS /api/menu/9 204 0.966 ms - -
DELETE /api/menu/9 500 27.811 ms - 1512
SqliteError: FOREIGN KEY constraint failed
    at PreparedQuery.values (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/better-sqlite3/session.js:106:28)
    at PreparedQuery.all (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/better-sqlite3/session.js:81:23)
    at QueryPromise.resultCb (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/session.js:119:64)
    at QueryPromise.execute (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/sqlite-core/session.js:13:17)
    at QueryPromise.then (file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/node_modules/.pnpm/drizzle-orm@0.44.7_better-sqlite3@12.11.1_pg@8.23.0/node_modules/drizzle-orm/query-promise.js:21:17)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)


 ```
## Feature suggestion

- [ui] [RESOLVED (Phase 2)] implement the signup on initial setup
  - **Resolution**: Implemented interactive `SignUpPage.jsx` with input validation, password confirmation (min 6 chars), role selector (`admin` vs `cashier`), and login link. Wired `api.auth.signup` in `client.js` and `useAuth` hook with automatic session login and `localStorage` persistence.
- [ui] [RESOLVED (Phase 2)] add staff account creation under admin account so the admin needs its own dashboard for managing, shops, staff, later on finance and ledgers
  - **Resolution**: Built dedicated `AdminConsolePage.jsx` at `/admin` guarded by admin role. Features staff accounts list with live search, account statistics (Total, Admins, Cashiers), interactive "+ Provision Staff Account" modal, and account deactivation with self-deletion protection. Added `👥 Staff & Admin` navigation tab across headers.
- [backend] [RESOLVED (Phase 2)] for above ui features we need routes and database relations and schemas
  - **Resolution**: Mounted `GET /api/auth/users`, `POST /api/auth/users`, and `DELETE /api/auth/users/:id` guarded by `isLoggedIn` and `isAdmin` in backend router. Added full SQLite desktop IPC parity (`auth:list-users`, `auth:create-user`, `auth:delete-user`) with scrypt/bcrypt password hashing fallback.
- [ui] [RESOLVED (Phase 1)] item editing is not implemented, updating info, price, name, deleteing , we should open modal to do this on fly.
  - **Resolution**: Created `EditMenuItemModal.jsx` for on-the-fly editing of name, price, and category. Built dedicated Menu Management console (`MenuManagementPage.jsx`) at `/menu` with full catalog table, category filters, quick item addition, and instant editing/deletion, linked from the header navigation tabs and POS dashboard. Exposed `api.menu.update(id, input)` in `client.js` with `PATCH /api/menu/:id` integration and IPC handler parity.
- [ui] [RESOLVED (Phase 1)] upon refresh it exits the session resulting in offline not working specially if backend is exited, and needed to login againg, even if the backend is active and refreshed it signs out which is bad look.
  - **Resolution**: Persisted user profile into `localStorage` (`restaurant_user`). Updated `useAuth` to synchronously hydrate `user` on initial mount to eliminate redirect flashes. Implemented non-blocking background revalidation via `/api/auth/me` when online while preserving cached credentials if offline.
- [ui] [RESOLVED (Phase 3)] custom category adding and prebuilt categories for food and drink items.
  - **Resolution**: Added prebuilt category options (`Coffee`, `Tea`, `Cold Drinks`, `Bakery`, `Sandwiches`, `Desserts`) and a "+ Custom Category..." input option in both `MenuManagementPage.jsx` ("+ Add Menu Item" modal) and `EditMenuItemModal.jsx`.

- [ui] [RESOLVED] add confirmation modals for any actions ,
  - **Resolution**: Created minimal, reusable `<ConfirmModal />` component in `src/features/common/ConfirmModal.jsx` styled with dark/light theme support. Replaced raw `window.confirm()` and unconfirmed operations across:
    1. Menu item catalog deletion in `MenuManagementPage.jsx`.
    2. Menu item quick card deletion in `MenuList.jsx`.
    3. Staff account deactivation in `AdminConsolePage.jsx`.
    4. Order ticket cancellation in `OrderDetailsModal.jsx`.
    5. Active cart ticket clearing in `CurrentTicket.jsx`.
- [ui] [RESOLVED] consolidate the user management top bar ,currenlty we have admin as well as cashier labels appear after user logs and logout button also appears so we need just on circular button to show drop down and display the current logged in user, necessary action buttons.
  - **Resolution**: Created minimal, reusable `<UserMenu />` circular avatar button component (`src/features/common/UserMenu.jsx`) with click-outside dismiss backdrop. Replaced raw username, role pills, and logout buttons across `DashboardPage.jsx`, `MenuManagementPage.jsx`, and `AdminConsolePage.jsx` with the circular trigger. The dropdown menu cleanly displays the user profile avatar, username, role tag (`Administrator` / `Cashier`), quick POS/Menu/Admin navigation links, and a styled log out action button.
- [ui] [RESOLVED] the order item list must show the full information about the order in the list not only the price and paid tag, name of the order , amount, paid or cancelled, customer name if available, cashier , barista, date or time
  - **Resolution**:
    1. Extended `src/utils/order.js` with `parseOrderDetails(order, menuItems)` and `formatOrderTime(dateValue)` returning order name (item summary), amount, status badge, customer name, cashier (from `users.username`), barista, dining mode, clean instructions, and relative date/time.
    2. Enriched `client.js` in both HTTP and Desktop modes to cache and restore `items` on orders so order item summaries display accurately in list views.
    3. Enhanced `CurrentTicket.jsx` POS input controls to capture optional Customer Name and Barista alongside table/dining mode and special instructions.
    4. Redesigned `OrderList.jsx` order cards to render:
       - Row 1: Order `#ID`, Order Name / Items summary, Amount formatted, Status tag (`open`, `paid`, `cancelled`), and offline pill.
       - Row 2: Date/time badge (`🕒 Today, ...`), Customer name badge (`👤 Name`), Cashier (`🏷️ Cashier: ...`), Barista (`☕ Barista: ...`), and Dining mode badge (`🍽️ Table ...` / `🛍️ Takeaway`).
       - Row 3: Customer instructions / special note.
       - Action controls: Quick "Mark paid" and "Cancel" buttons with confirmation modal.
    5. Updated `OrderDetailsModal.jsx` receipt modal to display the identical enriched customer, cashier, and barista metadata.
    6. Added test coverage in `order.test.js` bringing passing frontend tests to 13/13 and monorepo total to 77/77.
- [ui] [RESOLVED] when clicking the order item inside the paid list it displays modal with information of the order but the created table is empty for all orders so far, it shows other informations except the order item, qty, price etc are empty in the table you created, either remove or make it vertical tabular maching cross from each other
  - **Resolution**:
    1. Identified that `findAll()` in backend and desktop services did not eager-load line items, and `orders.get(id)` was missing from desktop IPC. Updated both `app/backend/src/features/orders/orders.repository.js` and `app/backend/src/services/orders.service.js` to eager-load `orderItems` and added `get(id)` methods.
    2. Registered `orders:get` in `app/desktop/src/ipc/orders.ipc.js`, `app/desktop/src/preload.js`, and `app/frontend/src/api/client.js`.
    3. Replaced the empty spreadsheet `<table>` in `OrderDetailsModal.jsx` with a clean **vertical tabular layout matching directly across from each other**:
       - Status, Date & Time, Customer, Cashier, Barista, and Dining Mode all match across from each other.
       - Each order item line displays quantity pill, item name, unit price, and line subtotal matching directly across from each other.
       - Pricing breakdown (Subtotal, Sales Tax, Total Amount) matches directly across from each other.
       - When historical orders have no line items, displays order summary and total matching directly across from each other instead of an empty table.
       - Automatically auto-fetches order items via `api.orders.get(id)` when modal opens if items aren't already loaded.
- [ui] [RESOLVED] lets move the finances to admin only and move from dashboard to its own tab like menu editing tab
  - **Resolution**:
    1. Built dedicated `FinancesPage.jsx` at `/finances` (with `/finance` alias) restricted strictly to `user.role === 'admin'`.
    2. Completely removed revenue and metrics banner cards from `DashboardPage.jsx`, leaving the POS Register clean and focused solely on taking and managing orders.
    3. `FinancesPage.jsx` provides: period filtering (`Today` vs `All Time`), Gross Revenue, Average Ticket Value, Pending Orders Value, Lost/Cancelled Value, Dining Mode breakdown (`Dine-In` vs `Takeaway`), Staff Sales Performance, searchable Transaction Ledger with status filter, and printable reports.
    4. Linked `💰 Finances` in navigation tabs across `DashboardPage.jsx`, `MenuManagementPage.jsx`, `AdminConsolePage.jsx`, and `UserMenu.jsx` dropdown for admin accounts.
- [ui] [RESOLVED] staff or cashiers should not be allowed to see the menu catalog editing or page at all if they cannot delete; give them only the page for ordering and order management and leave the dashboard for different things to admin
  - **Resolution**:
    1. Restricted `/menu` route in `app/frontend/src/app.jsx` strictly to `user.role === 'admin'`; non-admins are redirected automatically to `/dashboard`.
    2. Added `if (!isAdmin)` access restriction guard in `MenuManagementPage.jsx`.
    3. Removed `☕ Menu Catalog` from navigation headers and `UserMenu.jsx` for non-admin users.
    4. Guarded `Manage Menu Catalog →` shortcut link in `DashboardPage.jsx` so cashiers and staff only ever see the POS ordering and order management interface.
    5. Verified 100% of monorepo automated tests passing (77/77) and clean production build.
- [ui] [RESOLVED] lets use external package lucide icons instead of emojis
  - **Resolution**:
    1. Installed `lucide-react` in `app/frontend/package.json`.
    2. Replaced all raw unicode emojis and symbol glyphs across the entire application with modern Lucide icons:
       - Navigation & Brand: `Utensils` (branding), `ClipboardList` (POS Register), `Coffee` (Menu Catalog), `CircleDollarSign` (Finances), `Users` (Staff & Admin), `LogOut` (Sign Out).
       - Order & POS Cards: `Clock` (Timestamp), `User` (Customer), `Tag` (Cashier), `Coffee` (Barista), `ShoppingBag` (Takeaway), `Utensils` (Dine-In), `X` (Clear/Dismiss), `Trash2` (Remove).
       - Theme & Actions: `Sun` / `Moon` (Theme toggles), `Lock` (Permission guard), `Printer` (Print report), `RefreshCw` (Data sync), `Pencil` (Edit item), `Trash2` (Delete item).
    3. Updated components: `TitleBar.jsx`, `UserMenu.jsx`, `DashboardPage.jsx`, `MenuManagementPage.jsx`, `FinancesPage.jsx`, `AdminConsolePage.jsx`, `OrderList.jsx`, `CurrentTicket.jsx`, `OrderDetailsModal.jsx`, `MenuList.jsx`, `EditMenuItemModal.jsx`, `Login.jsx`, `SignUp.jsx`, `Homepage.jsx`.
    4. Verified zero remaining raw emojis with regex scan, Vite production bundle completed cleanly, and all 80/80 automated monorepo tests pass green.

- [ui] [RESOLVED] the receipt and report printing is doing screenshots which is not the right way to print for pos machines we need extenral deps to create the receipts and for reports we need something to create pdf output not screenshot.
  - **Resolution**:
    1. Installed `jspdf` and `jspdf-autotable` in `@restaurant/frontend` for client-side vector PDF generation.
    2. Implemented `app/frontend/src/utils/pdf.js`:
       - **POS 80mm Thermal Receipt Generator (`createReceiptPdf`, `printReceiptPdf`, `downloadReceiptPdf`)**: Produces formatted 80mm width thermal receipts with store branding, order metadata, line items (quantity, unit price, line totals), itemized subtotal/tax/grand-total, and receipt footer message. Prints directly via an isolated invisible iframe without capturing window screenshots, with a secondary option to download the receipt PDF directly.
       - **Financial & Revenue Report Generator (`createFinancialReportPdf`, `printFinancialReportPdf`, `downloadFinancialReportPdf`)**: Produces structured A4 multi-page PDF reports containing store header, executive summary KPI grid (gross revenue, average ticket, pending, cancelled), dining channel breakdown (dine-in vs takeaway volume and sales shares), and full transactions ledger table via `autoTable`.
    3. Integrated into `OrderDetailsModal.jsx` (providing "Print Receipt" and "PDF" download buttons) and `FinancesPage.jsx` (providing "Print PDF" and "Export PDF" buttons).
    4. Added automated unit tests in `app/frontend/test/pdf.test.js` verifying receipt 80mm geometry, item fallbacks, and multi-column financial report generation. All 83/83 monorepo tests pass.