# Backend Specialist Report

## Current State

The backend application (`@restaurant/backend`) has been fully modernized, remediated, and verified against `project_spec.md` and `arch.md`. All feature modules (`menu`, `auth`, `orders`, `dashboard`) follow a clean, functional NestJS-inspired separation of concerns pattern (Schema/DTO -> Repository -> Service -> Controller -> Router/Module) with dependency injection and dual-dialect database support (SQLite & PostgreSQL).

### 1. Architectural Pattern & Separation of Concerns
All feature domains in `src/features/` adhere to a consistent 5-layer separation:
- **`*.schema.js` (DTOs & Validation Contracts)**: Zod schemas defining request validation contracts (`create*InputSchema`, `update*InputSchema`) and response envelope shapes.
- **`*.repository.js` (Data Access Layer / DAO)**: Factory `create*Repository({ db, schema })` encapsulating all Drizzle ORM queries, joins, and database mutations. Completely decoupled from HTTP transport.
- **`*.service.js` (Business & Domain Logic)**: Factory `create*Service(repository)` enforcing business rules, total calculation, availability checks, password hashing/verification, and error creation (`statusCode`).
- **`*.ctrl.js` (HTTP Transport & Formatting)**: Factory `create*Controller(service)` handling Express `req`/`res`, status mapping (`200`, `201`, `400`, `401`, `404`), cookie management, and standard JSON envelope formatting (`{ success, data, ... }`).
- **`*.router.js` (Assembler / Module)**: Wires together Repository -> Service -> Controller with middlewares (`inputValidationBody`, `isLoggedIn`, `isAdmin`), maps routes, and exports both the configured router and individual factories.

### 2. Feature Domains Overview
- **`menu`**:
  - `GET /api/menu`: Lists all menu items.
  - `GET /api/menu/:id`: Retrieves single item by ID.
  - `POST /api/menu`: Creates menu item with duplicate name prevention.
  - `PATCH /api/menu/:id`: Updates menu item fields.
  - `DELETE /api/menu/:id`: Deletes menu item.
- **`auth`**:
  - `POST /api/auth/signup`: Registers new user, hashes password with bcrypt (supports scrypt fallback), defaults role to `cashier` or `admin`, sets `accessToken` cookie, and returns `{ success, user, token }`.
  - `POST /api/auth/login`: Validates credentials, sets `accessToken` cookie, and returns JWT token and user profile.
  - `GET /api/auth/me`: Authenticated profile check (requires `isLoggedIn`).
- **`orders`**:
  - `GET /api/orders`: Lists orders joined with user details, ordered descending.
  - `POST /api/orders`: Creates order, validates item existence and availability, computes `totalCents` server-side, inserts order and line items, returns created order with status `open`.
  - `GET /api/orders/:id`: Fetches order details with line items.
  - `PATCH /api/orders/:id/status`: Updates order status (`open`, `paid`, `cancelled`).
- **`dashboard`**:
  - `GET /api/dashboard` & `GET /api/dashboard/today`: Computes today's total order count and paid order revenue using dialect-agnostic ANSI SQL (`coalesce(sum(case when ...))`), working identically on SQLite and PostgreSQL.

### 3. Middleware & Security Transport
- **`isLoggedIn`**: Updated in `src/middlewares/auth.middleware.js` to extract tokens from both `Authorization: Bearer <token>` HTTP header and `req.cookies.accessToken`.
- **`inputValidationBody`**: Updated in `src/middlewares/validation.middleware.js` to return HTTP 400 Bad Request on schema failures with flattened error details.
- **`Desktop Compatibility`**: Created CommonJS compatibility adapters in `src/db/` and `src/services/` exposing `openDatabase` and `createServices` for Electron IPC offline mode.

### 4. Modular Test Suite Architecture (`test/`)
Tests have been partitioned into dedicated domain folders within `test/` instead of a single crammed file:
- **`test/helpers/test-server.js`**: Shared ephemeral Express test server lifecycle and JWT test token generator.
- **`test/auth/auth.test.js`** (10 tests): Signup, login, duplicate detection, wrong password, auth cookies, and `/me` Bearer token verification.
- **`test/menu/menu.test.js`** (8 tests): Listing, creation, ID lookup, duplicate name prevention, price validation, updates, and deletion.
- **`test/orders/orders.test.js`** (11 tests): Unauthenticated guards, empty items validation, non-existent items, quantity checks, server-side price calculation, nested line items, and status transitions (`paid`/`cancelled`).
- **`test/dashboard/dashboard.test.js`** (4 tests): Metric extraction, alias endpoint `/today`, order counting, and paid-only revenue summation.
- **Execution**: Running `pnpm test` triggers `node --test 'test/**/*.test.js'` executing all 37 tests in ~12s with 100% pass rate (37 pass, 0 fail).

---

## Activity Log

| Date | Task | Commit Message |
| :--- | :--- | :--- |
| 2026-10-02 | Initial Handoff & Backend Codebase Audit | docs(backend): initial handoff audit and current state report |
| 2026-10-02 | Auth Feature Remediation & Layered Architecture | feat(backend): implement auth repository, service, controller, and router |
| 2026-10-02 | Bearer Token & Cookie Auth Middleware | feat(backend): support Authorization header and cookie tokens in auth middleware |
| 2026-10-02 | Orders Feature Modernization to ESM & 5-Layer Pattern | feat(backend): implement orders repository, service, controller, and router |
| 2026-10-02 | Dialect-Agnostic Dashboard Feature | feat(backend): implement dashboard repository, service, controller, and router |
| 2026-10-02 | Route Registration & Cross-Agent Integration | feat(backend): mount auth, orders, and dashboard routes in main.route.js |
| 2026-10-02 | Desktop IPC Database and Services Compatibility Layer | feat(backend): add db and services adapter packages for Electron IPC |
| 2026-10-02 | Automated Test Suite Modernization to ESM | test(backend): modernize test/api.test.js with node:test and verify all routes |
| 2026-10-02 | Modular Domain Test Suite Architecture | test(backend): partition test suite into modular folders under test/ |

---

## Local Backlog

- [x] **Task 1 (Auth Remediation)**: Refactor `auth.service.js` and `auth.ctrl.js` to ESM; connect to `src/database/database.js` (`schema.users`), fix JWT signing/secrets, supply `createdAt` timestamp, and handle password hashing/verification cleanly.
- [x] **Task 2 (Auth Middleware Header Support)**: Update `isLoggedIn` in `src/middlewares/auth.middleware.js` to extract bearer tokens from `Authorization: Bearer <token>` header in addition to cookies.
- [x] **Task 3 (Orders Feature Modernization)**: Convert `orders.schema.js`, `orders.service.js`, and `orders.router.js` from CommonJS to ESM; adopt repository/service pattern matching `arch.md` and inject dynamic dialect schema.
- [x] **Task 4 (Dashboard Feature Modernization & SQLite Dialect Support)**: Convert `dashboard.service.js` and `dashboard.router.js` to ESM; write dialect-aware aggregation queries compatible with both SQLite and PostgreSQL.
- [x] **Task 5 (Route Mounting & Integration)**: Mount `/api/auth`, `/api/orders`, and `/api/dashboard` in `src/routes/main.route.js` satisfying Frontend cross-agent request in `sync.md`.
- [x] **Task 6 (Desktop Interface Alignment)**: Provide a clean service adapter or compatibility layer for `app/desktop/src/main.js` (`openDatabase` and `createServices`).
- [x] **Task 7 (Automated Backend Verification)**: Modernize `test/api.test.js` to ESM to verify auth, menu, order creation, total computation, and dashboard statistics against SQLite/Postgres.
- [x] **Task 8 (Modular Test Suite Restructuring)**: Deconstruct monolithic test file into modular domain test suites under `test/{auth,menu,orders,dashboard}` with shared `test/helpers/test-server.js`.
