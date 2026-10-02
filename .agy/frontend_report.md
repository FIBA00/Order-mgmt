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

- **Production Build**: Clean Vite 7 bundle generated via `pnpm build:frontend` in ~6.9s with zero errors or warnings.
- **Automated Tests**: 9 of 9 unit tests passing across 2 suites via native `pnpm --filter @restaurant/frontend test` (`node --test`).

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

---

### 🗺️ Unified & Replanned Domain Roadmap

The combined roadmap synthesizes existing operational goals with the user's new feature suggestions into 4 logical phases:

| Phase       | Milestone                              | Priority | Focus                                                                         |
| :---------- | :------------------------------------- | :------- | :---------------------------------------------------------------------------- |
| **Phase 1** | **Operational Stability & POS Parity** | 🟢 P0    | ✅ Completed (Session persistence, item editing modal, offline caching)       |
| **Phase 2** | **Onboarding & Staff Provisioning**    | 🟡 P1    | Functional signup page on initial setup, admin staff creation console         |
| **Phase 3** | **Store Operations & Layout**          | 🔵 P2    | Table/section management, item modifiers, store profile & tax settings        |
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

#### Phase 2: User Onboarding & Staff Provisioning (🟡 P1 — Next)

- [ ] **2.1 Initial Setup & Signup Flow**:
  - Implement functional `SignUpPage.jsx` with input validation and role selection.
  - Implement `api.auth.signup` with auto-login on successful registration.
  - Seamless navigation between Login and Signup.
- [ ] **2.2 Admin Console — Staff Account Provisioning**:
  - Dedicated admin tab in dashboard for managing staff.
  - Staff creation modal (username, password, role `cashier`/`admin`).
  - Listing active staff accounts with role indicators.

#### Phase 3: Store Operations & Domain Enhancements (🔵 P2)

- [ ] **3.1 Table / Section Management**:
  - Visual table selector / ticket tagging (e.g. Table 1-20, Bar, Takeaway).
  - Filter orders and active tickets by table identifier.
- [ ] **3.2 Item Modifiers & Customizations**:
  - Item options (e.g. Oat Milk, Extra Shot, Decaf, No Sugar).
  - Modifier price adjustments computed in subtotal.
- [ ] **3.3 Configurable Store Profile & Tax**:
  - Settings page for Store Name, Tax Rate (%), Currency, and Receipt header/footer text.

#### Phase 4: Kitchen & Reporting Systems (🟣 P3)

- [ ] **4.1 Kitchen Display System (KDS)**:
  - Dedicated full-screen `/kds` route for kitchen/barista staff.
  - Elapsed timers, ticket order status toggling, and sound/visual alerts.
- [ ] **4.2 Shift & Cash Drawer Management**:
  - Opening float, cash-in/cash-out tracking, and end-of-shift Z-Report summary.
- [ ] **4.3 Financial Ledgers & Sales Analytics**:
  - Daily ledger reconciliation, top-selling items report, peak hours volume chart.
