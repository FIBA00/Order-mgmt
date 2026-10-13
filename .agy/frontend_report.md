# Frontend Specialist Report

## Current State

The frontend application (`@restaurant/frontend`) is fully functional, equipped with a domain-specific switchable Dark/Light theme, production-grade restaurant POS workflows, offline persistence, automated tests, and verified against `project_spec.md`.

### 1. Theme & Design System (Cafe & Restaurant Domain)

- **Palette**:
  - Primary Brand / Action: Warm Caramel & Espresso Amber (`amber-600` / `#d97706` in light, `amber-500` / `#f59e0b` in dark) with custom `@theme` palette (`--color-cafe-50` through `--color-cafe-950`).
  - Neutrals: Warm Stone & Roasted Charcoal (`stone-50` through `stone-950`).
  - Functional POS Accents: Emerald (`paid`), Amber (`open` attention), Red (`cancelled`).
- **Dark & Light Mode Switching**:
  - Configured `@custom-variant dark (&:where(.dark, .dark *));` in `src/index.css`.
  - Implemented `useTheme` hook in `src/utils/theme.js` with instant switching and `localStorage` persistence.
  - Interactive theme toggles (☀️ / 🌙) embedded in the navigation headers of `DashboardPage`, `LoginPage`, and `Homepage`.

### 2. POS Domain Workflows

- **Current Ticket Builder (`CurrentTicket.jsx`)**: Multi-item cart building with quantity controls (`+` / `-`), line removal, table/customer notes, and subtotal calculation.
- **Itemized Receipt Modal (`OrderDetailsModal.jsx`)**: Line-item details inspection, order status modification, and receipt printing action (`window.print()`).
- **Categorization & Search (`MenuList.jsx`)**: Category filter chips, instant search, and admin menu item controls.
- **Order Stream Management (`OrderList.jsx`)**: Status filter tabs (`All`, `Open`, `Paid`, `Cancelled`), search, and click-to-inspect receipts.

### 3. Build & Test Health

- **Production Build**: Clean Vite 7 bundle generated via `pnpm build:frontend` in ~6.5s with zero errors or warnings.
- **Automated Tests**: 13 of 13 unit tests passing across 2 suites via native `pnpm --filter @restaurant/frontend test` (`node --test`). Monorepo test count: 77/77 passing.

---

## Activity Log

| Date       | Task                                                              | Commit Message                                                             |
| :--------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------- |
| 2026-10-02 | Initial Handoff & Frontend Codebase Audit                         | docs: frontend initial handoff audit and backlog update                    |
| 2026-10-02 | Fix Vite production build & remove browser Node.js imports        | fix(frontend): eliminate config.js and migrate to import.meta.env          |
| 2026-10-02 | Restore application routing and auth guards in app.jsx            | feat(frontend): restore routes, auth guards, and login flow                |
| 2026-10-02 | Implement offline persistence and background sync queue           | feat(frontend): offline-first local storage and sync engine                |
| 2026-10-02 | Add admin menu item creation and deletion controls                | feat(frontend): admin menu item creation and deletion UI                   |
| 2026-10-02 | Clean up empty directories and verify root build                  | chore(frontend): prune empty directories and verify production build       |
| 2026-10-02 | Implement native test runner and unit test suites                 | test(frontend): add node test suite for money and order utilities          |
| 2026-10-02 | Implement multi-item POS ticket builder (CurrentTicket)           | feat(frontend): multi-item POS ticket and cart manager                     |
| 2026-10-02 | Implement itemized receipt breakdown modal (OrderDetailsModal)    | feat(frontend): itemized order inspection and receipt print                |
| 2026-10-02 | Add menu category filtering, live search, and order filters       | feat(frontend): menu category tabs, search, and order status filters       |
| 2026-10-02 | Design and implement switchable warm cafe theme across UI         | feat(frontend): cafe amber/stone light-dark theme and useTheme hook        |
| 2026-10-02 | Prepare implementation plans and replan domain roadmap            | docs(frontend): synthesize user feature suggestions into unified roadmap   |
| 2026-10-02 | Complete Phase 1: Session persistence on reload & item edit modal | feat(frontend): implement session persistence and item editing modal       |
| 2026-10-02 | Create dedicated Menu Management page (/menu) and navigation tabs | feat(frontend): add MenuManagementPage with catalog table and edit actions |
| 2026-10-13 | Complete Phase 2: Functional setup/signup flow & Admin Console    | feat(frontend): implement SignUpPage and AdminConsolePage staff management |
| 2026-10-13 | Implement theme-aware ConfirmModal across all destructive actions | feat(frontend): add ConfirmModal for menu delete, staff remove, cancel, clear ticket      |
| 2026-10-13 | Menu category persistence & Non-admin menu catalog guards        | fix(frontend): persist categories in local storage and guard actions for non-admin users  |
| 2026-10-13 | Create Frontend Architecture & Developer Guide in .docs/          | docs(frontend): comprehensive architecture, mermaid diagrams, backend trace & guide       |
| 2026-10-13 | Display full metadata in Order Item List UI (OrderList.jsx)       | feat(frontend): full order info display (name, amount, status, customer, staff, time)    |
| 2026-10-13 | Vertical tabular layout & eager loading in OrderDetailsModal      | fix(frontend): fix empty modal items table with matching vertical tabular rows & eager loading |
| 2026-10-13 | Segregate finances & revenue reporting into dedicated Finances tab | feat(frontend): dedicated /finances admin page, remove revenue metrics from POS register |
| 2026-10-13 | Restrict Menu Catalog (/menu) to admin only for pure staff POS    | feat(frontend): restrict /menu to admins, hide catalog editing from cashiers/staff       |

---

## Plans for Implementations (Unified & Replanned Roadmap)

### 📋 Feature Suggestion Analysis & Technical Specifications

#### 1. Session Persistence & Seamless Offline Reload

- **Problem**: In `useAuth.js`, `const [user, setUser] = useState(null)` defaults to `null`. On every browser refresh, `user` resets to `null`, forcing an immediate redirect to `/login`. If the backend is unreachable or offline, the user is locked out, breaking offline-first guarantees.
- **Solution Architecture**:
  - Introduce `STORAGE_KEYS.USER: "restaurant_user"` in `client.js`.
  - On `login`/`signup`, store user object (`id`, `username`, `role`) into `localStorage`.
  - In `useAuth`, synchronously initialize `user` from `localStorage.getItem("restaurant_user")`.
  - On startup/online state, perform background revalidation (`GET /api/auth/me`), updating the stored profile if successful without blocking offline rendering.
  - On explicit `logout` or `401 Unauthorized` token expiry, wipe both `token` and `user` from storage.
- **Impacted Files**:
  - [`src/api/client.js`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/api/client.js)
  - [`src/features/auth/useAuth.js`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/features/auth/useAuth.js)
  - [`src/app.jsx`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/app.jsx)

#### 2. Interactive On-the-Fly Menu Item Editing Modal

- **Problem**: Menu item cards in `MenuList.jsx` only provide an item deletion trigger (`✕`). Admins cannot edit item names, price, or category on the fly.
- **Solution Architecture**:
  - Create `app/frontend/src/features/menu/pages/EditMenuItemModal.jsx` featuring inputs for Item Name, Price ($/cents conversion via `money.js`), Category, and active toggle.
  - Expose `api.menu.update(id, input)` in `client.js` hitting backend `PATCH /api/menu/:id` (and local cache fallback).
  - Add an Edit button (`✎`) on menu cards for admins that opens the edit modal pre-populated with current values.
  - On save, update local menu state in `DashboardPage.jsx` and persist to `localStorage`.
- **Impacted Files**:
  - `app/frontend/src/features/menu/pages/EditMenuItemModal.jsx` (New component)
  - [`src/features/menu/pages/MenuList.jsx`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/features/menu/pages/MenuList.jsx)
  - [`src/pages/DashboardPage.jsx`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/pages/DashboardPage.jsx)
  - [`src/api/client.js`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/api/client.js)

#### 3. Initial Setup & Staff/Admin Signup Flow

- **Problem**: `SignUpPage.jsx` is currently a static placeholder with no input fields. First-run users cannot initialize an admin account or self-register on initial deployment.
- **Solution Architecture**:
  - Transform `app/frontend/src/features/auth/pages/SignUp.jsx` into an active registration form (username, password, role selection).
  - Expose `api.auth.signup(data)` calling `POST /api/auth/signup` and persisting token + user.
  - Provide a clean toggle/link between `/login` and `/signup`.
  - Auto-navigate to `/dashboard` upon successful signup.
- **Impacted Files**:
  - [`src/features/auth/pages/SignUp.jsx`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/features/auth/pages/SignUp.jsx)
  - [`src/api/client.js`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/api/client.js)
  - [`src/features/auth/useAuth.js`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/features/auth/useAuth.js)

#### 4. Admin Management Console (Staff, Shops, Ledgers Foundation)

- **Problem**: Admin lacks a dedicated administrative view to manage staff accounts, store properties, and financial ledgers.
- **Solution Architecture**:
  - Add a sub-navigation or tab in `DashboardPage.jsx` (`POS Terminal` vs `Admin Console`) displayed only when `user.role === 'admin'`.
  - **Staff Management Panel**:
    - List current staff accounts (cached locally / fetched from backend).
    - Provision new cashier/staff accounts with username and temporary password.
    - Revoke or delete staff access.
  - **Shop / Store Settings Panel**:
    - Manage Store Name, Address, Tax Rate (%), Currency Symbol, and Receipt Header/Footer.
  - **Ledgers & Audit Trail (Foundation)**:
    - Overview of daily settled orders, total sales by payment method, and exportable summary.
- **Impacted Files**:
  - [`src/pages/DashboardPage.jsx`](file:///home/fraold/Develop_and_Code/StandardProjects/MERN/Desktop-app/Order-mgmt/app/frontend/src/pages/DashboardPage.jsx)
  - `app/frontend/src/features/admin/pages/AdminConsole.jsx` (New component)
  - `app/frontend/src/features/admin/pages/StaffManager.jsx` (New component)

#### 5. Cross-Agent Backend Alignment

- **Problem**: Frontend admin features require backend route mounts and schema support.
- **Solution**:
  - Log requirement in `sync.md` for Backend specialist:
    1. `GET /api/users`: Admin-guarded list of registered staff.
    2. `POST /api/users` / `POST /api/auth/signup`: Staff provisioning.
    3. `DELETE /api/users/:id`: Deactivate staff account.
    4. Database relations for store settings (`shops`) and financial ledgers.

#### 6. In-App Confirmation Modals for Actions (User Report Suggestion)

- **Problem**: Destructive actions (menu item deletion, staff deactivation) currently rely on browser-native `window.confirm()`, which breaks theme styling (dark/light mode) and creates OS-level modal freezes in Electron. Additionally, order cancellation in `OrderDetailsModal` and cart clearing in `CurrentTicket` execute instantly without an undo or confirmation safety prompt.
- **Solution Architecture**:
  - Create `app/frontend/src/features/common/ConfirmModal.jsx`: minimal (~40 lines), accessible dialog styled with the cafe palette (`amber-600`, `stone-900`/`stone-100`, red-600 danger accents).
  - Integrate across:
    1. `MenuManagementPage.jsx` (Menu item deletion)
    2. `MenuList.jsx` (Menu item quick card deletion)
    3. `AdminConsolePage.jsx` (Staff account deactivation)
    4. `OrderDetailsModal.jsx` (Order cancellation)
    5. `CurrentTicket.jsx` (Clearing active ticket)

---

### 🗺️ Unified & Replanned Domain Roadmap

The combined roadmap synthesizes existing operational goals with the user's new feature suggestions into 4 logical phases:

| Phase       | Milestone                              | Priority | Focus                                                                         |
| :---------- | :------------------------------------- | :------- | :---------------------------------------------------------------------------- |
| **Phase 1** | **Operational Stability & POS Parity** | 🟢 P0    | ✅ Completed (Session persistence, item editing modal, offline caching)       |
| **Phase 2** | **Onboarding & Staff Provisioning**    | 🟢 P1    | ✅ Completed (Functional signup on initial setup, admin staff creation console) |
| **Phase 3** | **Store Operations & Layout**          | 🟢 P2    | Table/section management, item modifiers, store profile & tax settings (Completed) |
| **Phase 4** | **Kitchen & Financial Intelligence**   | 🟣 P3    | Kitchen Display System (KDS), shift cash drawer / Z-Report, financial ledgers |

#### Phase 1: Operational Stability & Core POS Parity (🟢 P0 — Completed)

- [x] **1.1 Session Persistence & Offline Refresh**:
  - Synchronous `user` hydration from `localStorage` (`restaurant_user`) in `useAuth`.
  - Eliminated accidental logouts on browser refresh and offline startup.
  - Automatic non-blocking token revalidation via `/api/auth/me` when connectivity is present.
- [x] **1.2 Dedicated Menu Management Page & Editing Modal**:
  - Created `MenuManagementPage.jsx` mounted at `/menu` with full item catalog table, inline category pills, search bar, and "+ Add Menu Item" modal.
  - Added header navigation tabs (`📋 POS Register` vs `☕ Menu Catalog`) across views.
  - Created `EditMenuItemModal.jsx` for on-the-fly item name, price, and category updates.
  - Implemented `api.menu.update(id, input)` integrating with `PATCH /api/menu/:id` and desktop IPC.
  - Added admin edit triggers (`✎`) directly to menu item catalog cards in `MenuList.jsx`.
- [x] **1.3 Multi-Item POS Ticket Builder (`CurrentTicket.jsx`)** _(Completed)_
- [x] **1.4 Itemized Receipt Breakdown & Modal (`OrderDetailsModal.jsx`)** _(Completed)_
- [x] **1.5 Warm Cafe & Amber Switchable Theme** _(Completed)_
- [x] **1.6 Removal of Conflicting Seed Sources & Cache Purge** _(Completed)_

#### Phase 2: User Onboarding & Staff Provisioning (🟢 P1 — Completed)

- [x] **2.1 Initial Setup & Signup Flow**:
  - Implemented interactive `SignUpPage.jsx` with input validation, password confirmation (min 6 chars), and role selection (`admin` vs `cashier`).
  - Implemented `api.auth.signup` in `client.js` with auto-login on successful registration and session persistence to `localStorage`.
  - Added seamless navigation links between `/login` and `/signup`.
- [x] **2.2 Admin Console — Staff Account Provisioning**:
  - Built dedicated `AdminConsolePage.jsx` mounted at `/admin` guarded by role (`user.role === 'admin'`).
  - Added navigation header tab `👥 Staff & Admin` across `DashboardPage`, `MenuManagementPage`, and `AdminConsolePage`.
  - Built staff accounts list table with role badges, live search filter, and active account statistics (Total, Admins, Cashiers).
  - Built interactive "+ Provision Staff Account" modal with input validation.
  - Added account deactivation / deletion action with self-deletion protection guard.
  - Implemented full backend REST endpoints (`GET/POST/DELETE /api/auth/users`) and desktop IPC parity (`auth:list-users`, `auth:create-user`, `auth:delete-user`).

#### Phase 3: Store Operations & Domain Enhancements (🟢 P2 — Completed)

- [x] **3.1 Table / Section Management**:
  - Implemented visual Dining Mode toggle (`🍽️ Dine-In` vs `🛍️ Takeaway`) on POS register ticket builder (`CurrentTicket.jsx`).
  - Added Table / Bar selector (`Table 1-12`, `Bar 1-4`, `Patio 1-2`) with optional customer note input.
  - Extracted dining metadata (`parseDiningInfo`) in `utils/order.js` and rendered badges on order cards in `OrderList.jsx`.
  - Added Dining filter pills (`All Types`, `🍽️ Dine-In`, `🛍️ Takeaway`) to `OrderList.jsx`.
- [x] **3.2 Item Modifiers & Customizations**:
  - Added cafe modifiers drawer to ticket items in `CurrentTicket.jsx` (`Oat Milk +$0.75`, `Almond Milk +$0.75`, `Extra Shot +$0.50`, `Decaf`, `No Sugar`, `Extra Hot`, `Iced`).
  - Computed live modifier price adjustments into line item prices, subtotal, and tax totals.
  - Summarized modifier choices cleanly in order notes and receipt breakdowns.
- [x] **3.3 Configurable Store Profile & Tax Engine**:
  - Added dedicated `🏪 Store Profile & Tax` settings tab to `AdminConsolePage.jsx` for configuring Store Name, Address, Phone, Tax Rate (%), Currency, and Receipt Header/Footer.
  - Implemented `api.store.get()` and `api.store.save()` with localStorage persistence and default store profile fallback.
  - Rendered store branding header, itemized tax calculations (Subtotal, Tax, Total), and receipt footer in `OrderDetailsModal.jsx`.
  - Displayed live subtotal, estimated tax, and total breakdown in `CurrentTicket.jsx`.
- [x] **3.4 Prebuilt & Custom Categories (Inter-Phase Feature)**:
  - Added prebuilt category options (`Coffee`, `Tea`, `Cold Drinks`, `Bakery`, `Sandwiches`, `Desserts`) and dynamic custom category input in `MenuManagementPage.jsx` and `EditMenuItemModal.jsx`.
- [x] **3.5 Universal Action Protection Guards**:
  - Guarded active cart ticket clearing in `CurrentTicket.jsx`, order cancellations in `OrderList.jsx` and `OrderDetailsModal.jsx`, menu deletions in `MenuManagementPage.jsx` and `MenuList.jsx`, and staff deactivation in `AdminConsolePage.jsx` with `<ConfirmModal />`.
- [x] **3.6 Consolidated User Management Top Bar (`UserMenu.jsx`)**:
  - Replaced sprawling username, role pills, and logout buttons across headers with a unified circular avatar trigger button.
  - Interactive dropdown menu cleanly displays user profile info, role badge (`Administrator` vs `Cashier`), quick navigation links (`POS Register`, `Menu Catalog`, `Staff & Settings`), and a styled log out action button.


#### Phase 4: Kitchen & Reporting Systems (🟣 P3)

- [ ] **4.1 Kitchen Display System (KDS)**:
  - Dedicated full-screen `/kds` route for kitchen/barista staff.
  - Elapsed timers, ticket order status toggling, and sound/visual alerts.
- [ ] **4.2 Shift & Cash Drawer Management**:
  - Opening float, cash-in/cash-out tracking, and end-of-shift Z-Report summary.
- [ ] **4.3 Financial Ledgers & Sales Analytics**:
  - Daily ledger reconciliation, top-selling items report, peak hours volume chart.

