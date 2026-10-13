# Backend Architecture & Developer Guide

Welcome to the backend documentation for the **Restaurant & Cafe Order Management System**. This guide provides an end-to-end technical overview of the backend architecture, module connectivity, database ORM layer, request lifecycle, step-by-step guides for adding new features, and maintenance procedures.

---

## Table of Contents

1. [High-Level Overview & Architecture](#1-high-level-overview--architecture)
2. [Module Connectivity & Layered Architecture](#2-module-connectivity--layered-architecture)
3. [Sample Route End-to-End Trace (Mermaid Graphs)](#3-sample-route-end-to-end-trace)
4. [Starting and Stopping (Lifecycle & Scripts)](#4-starting-and-stopping)
5. [Database & Dual-Engine ORM (Drizzle)](#5-database--dual-engine-orm)
6. [How to Add a New Feature (Developer Recipe)](#6-how-to-add-a-new-feature)
7. [Security & Middlewares](#7-security--middlewares)
8. [Maintenance, Testing & Troubleshooting](#8-maintenance-testing--troubleshooting)

---

## 1. High-Level Overview & Architecture

The backend is built with **Node.js (v22+)** and **Express 5**, configured as an **ES Module (`"type": "module"`)** package. It serves two crucial purposes in the monorepo:

1. **Standalone REST API Server (`server.js`)**: Serves HTTP endpoints under `/api/*` for web clients, third-party integrations, and remote administration.
2. **Shared Domain Engine for Desktop Electron (`services/` & `database/`)**: Its domain business services and SQLite database layer are modularized so the Desktop Electron application (`app/desktop`) imports and executes them directly in-process via local IPC—with zero network latency and complete offline capability.

### Architectural Principles

* **Minimalism & Directness**: Direct functions under 40–50 lines, linear logic, no excessive abstractions or boilerplate patterns (no unnecessary classes, factories, or abstract layers).
* **Zero Raw SQL in Application Code**: All queries, mutations, and migrations use **Drizzle ORM** (`drizzle-orm`) exclusively. Raw queries (`db.prepare()`, `db.exec()`) are forbidden in application code.
* **Dual Database Engine Support**: Out of the box support for **SQLite** (via `better-sqlite3` for local development and offline desktop POS) and **PostgreSQL** (via `pg` for centralized cloud deployments), managed by Drizzle schema definitions.
* **Strict Input Validation**: Every request payload is validated using **Zod** (`zod`) schemas before entering controller logic, failing fast with clear HTTP 400 errors.
* **Security-First**: In-memory rate limiting against brute force attacks on authentication routes, password hashing with `bcrypt` / `scryptSync`, and JWT-based session authorization.

---

## 2. Module Connectivity & Layered Architecture

The backend follows a clean, linear 5-layer separation of concerns:

```mermaid
flowchart TD
    Client["Client (Web Browser / HTTP Client)"]
    
    subgraph EntryPoint ["1. Server & Routing Layer"]
        Server["src/server.js (Express Application)"]
        MainRouter["src/routes/main.route.js (Router Mount)"]
        Server --> MainRouter
    end

    Client -->|HTTP Request| Server

    subgraph MiddlewareLayer ["2. Middlewares"]
        RateLimiter["rate-limit.middleware.js (Auth Throttling)"]
        ValidationMW["validation.middleware.js (Zod Schema)"]
        AuthMW["auth.middleware.js (JWT & Role Check)"]
        ResponseMW["response.middleware.js (JSON Envelope)"]
        ErrorMW["error.middleware.js (Global Error Handler)"]
    end

    MainRouter --> RateLimiter
    RateLimiter --> ValidationMW
    ValidationMW --> AuthMW

    subgraph FeatureControllers ["3. Feature Controllers (HTTP Boundary)"]
        AuthCtrl["auth.ctrl.js"]
        MenuCtrl["menu.ctrl.js"]
        OrdersCtrl["orders.ctrl.js"]
        DashCtrl["dashboard.ctrl.js"]
    end

    AuthMW --> AuthCtrl
    AuthMW --> MenuCtrl
    AuthMW --> OrdersCtrl
    AuthMW --> DashCtrl

    subgraph DomainServices ["4. Domain Services (Business Logic)"]
        AuthService["auth.service.js"]
        MenuService["menu.service.js"]
        OrdersService["orders.service.js"]
        DashService["dashboard.service.js"]
        BarrelIndex["services/index.js (createServices)"]
        
        BarrelIndex -.-> AuthService
        BarrelIndex -.-> MenuService
        BarrelIndex -.-> OrdersService
        BarrelIndex -.-> DashService
    end

    AuthCtrl --> AuthService
    MenuCtrl --> MenuService
    OrdersCtrl --> OrdersService
    DashCtrl --> DashService

    subgraph RepositoryLayer ["5. Repositories & Data Access"]
        AuthRepo["auth.repository.js"]
        MenuRepo["menu.repository.js"]
        OrdersRepo["orders.repository.js"]
        DashRepo["dashboard.repository.js"]
    end

    AuthService --> AuthRepo
    MenuService --> MenuRepo
    OrdersService --> OrdersRepo
    OrdersService -.->|Price Validation| MenuRepo
    DashService --> DashRepo

    subgraph DatabaseLayer ["6. Database & ORM Layer"]
        Drizzle["Drizzle ORM (drizzle-orm)"]
        DBSelector["database/database.js (SQLite / Postgres)"]
        Schemas["database/schema/ (SQLite & Postgres schemas)"]
        DBClient[("SQLite file / PostgreSQL Database")]
        
        AuthRepo --> Drizzle
        MenuRepo --> Drizzle
        OrdersRepo --> Drizzle
        DashRepo --> Drizzle
        
        Drizzle --> DBSelector
        DBSelector --> Schemas
        DBSelector --> DBClient
    end

    subgraph DesktopApp ["Desktop App Integration"]
        ElectronApp["@restaurant/desktop (Local In-Process)"]
        ElectronApp -.->|Imports Directly| BarrelIndex
        ElectronApp -.->|Imports Directly| DBSelector
    end
```

### Layer Breakdown

1. **Routing Layer (`src/routes/`)**: Mounts domain feature routers (`/api/auth`, `/api/menu`, `/api/orders`, `/api/dashboard`) onto Express.
2. **Middleware Layer (`src/middlewares/`)**: Intercepts requests for rate-limiting, CORS, cookie/header parsing, JWT decoding (`isLoggedIn`, `isAdmin`), and Zod input validation (`inputValidationBody`).
3. **Controller Layer (`src/features/*/ctrl.js`)**: Handles HTTP req/res mapping, status codes, and error formatting.
4. **Service Layer (`src/services/` & `src/features/*/service.js`)**: Houses core domain logic (computing order totals, verifying passwords, generating JWTs, computing daily dashboard revenue). These functions are pure and database-agnostic.
5. **Repository Layer (`src/features/*/repository.js`)**: Executes data access using Drizzle ORM query builders (`select`, `insert`, `update`, `delete`).
6. **Database Layer (`src/database/`)**: Manages database connection pool, WAL mode configuration, migrations runner, and schema definitions.

---

## 3. Sample Route End-to-End Trace

Here is a complete sequence trace of creating a customer order via `POST /api/orders`, demonstrating how every component in the system interacts:

```mermaid
sequenceDiagram
    autonumber
    actor POS as Cashier / POS Client
    participant Express as Express (server.js)
    participant RateLimit as rate-limit.middleware
    participant Auth as auth.middleware (isLoggedIn)
    participant Validator as validation.middleware (Zod)
    participant OrdersCtrl as orders.ctrl.js
    participant OrdersService as orders.service.js
    participant MenuRepo as menu.repository.js
    participant OrdersRepo as orders.repository.js
    participant Drizzle as Drizzle ORM / SQLite DB

    POS->>Express: POST /api/orders { items: [{ menuItemId: 1, quantity: 2 }] }<br/>Authorization: Bearer <token>
    Express->>Auth: isLoggedIn(req, res, next)
    Auth->>Auth: Verify JWT & extract user id
    Auth-->>Express: req.user = { id: 1, role: "cashier" }
    
    Express->>Validator: inputValidationBody(createOrderSchema)
    Validator->>Validator: Validate items array & quantities
    Validator-->>Express: Validation passed

    Express->>OrdersCtrl: controller.createOrder(req, res)
    OrdersCtrl->>OrdersService: service.createOrder(req.user.id, req.body.items, req.body.note)
    
    critical Verify Prices & Availability
        OrdersService->>MenuRepo: menuRepository.findById(menuItemId)
        MenuRepo->>Drizzle: db.select().from(menuItems).where(eq(id, 1))
        Drizzle-->>MenuRepo: { id: 1, name: "Espresso", priceCents: 350, active: true }
        MenuRepo-->>OrdersService: MenuItem Record
    end

    OrdersService->>OrdersService: Compute line total (2 * 350 = 700 cents)
    OrdersService->>OrdersService: Compute grand total (700 cents)

    critical Atomic Order & Items Insertion
        OrdersService->>OrdersRepo: ordersRepository.create(userId, totalCents, items, note)
        OrdersRepo->>Drizzle: db.insert(orders).values({...})
        Drizzle-->>OrdersRepo: Created Order (id: 42)
        OrdersRepo->>Drizzle: db.insert(orderItems).values([...])
        Drizzle-->>OrdersRepo: Inserted 1 Order Item
        OrdersRepo-->>OrdersService: Full Order Entity with Items
    end

    OrdersService-->>OrdersCtrl: Created Order Details
    OrdersCtrl-->>POS: HTTP 201 Created { success: true, data: { id: 42, totalCents: 700, status: "open" } }
```

---

## 4. Starting and Stopping

### Environment Configuration

The backend reads configuration from `.env` or `.env.local` via `src/configs/env.config.js`:

```bash
# Server Port
PORT=3000

# Database Engine: 'sqlite' or 'postgres'
DB_CLIENT=sqlite

# SQLite Storage Path (when DB_CLIENT=sqlite)
SQLITE_DB_PATH=./data/app.sqlite

# PostgreSQL Connection String (when DB_CLIENT=postgres)
DATABASE_URL=postgresql://user:password@localhost:5432/restaurant_db

# Security & Secrets
JWT_SECRET=super-secret-jwt-key
NODE_ENV=development
```

### NPM / PNPM Commands

All commands can be run from `app/backend` or from the repository root:

| Command | Working Directory | Description |
| :--- | :--- | :--- |
| `pnpm dev` | `app/backend` | Starts backend in development mode with `nodemon` hot reloading. |
| `pnpm start` | `app/backend` | Starts production server (`node src/server.js`). |
| `pnpm test` | `app/backend` | Runs native Node test runner (`node --test`) with 1 concurrency. |
| `pnpm lint` | `app/backend` | Formats all backend files with Prettier. |
| `pnpm db:generate:sqlite` | `app/backend` | Generates new Drizzle SQL migration files from SQLite schemas. |
| `pnpm db:migrate:sqlite` | `app/backend` | Runs pending SQLite migrations programmatically. |
| `pnpm db:generate:postgres` | `app/backend` | Generates new Drizzle SQL migration files from Postgres schemas. |
| `pnpm db:migrate:postgres` | `app/backend` | Runs pending PostgreSQL migrations. |

### Lifecycle & Graceful Shutdown

In `src/server.js`:
* On boot: Evaluates database connection via `database.select()`, then starts HTTP listener on `PORT`.
* On termination (`SIGINT`, `SIGTERM`): The server can cleanly close the Express HTTP listener and disconnect database clients to prevent data corruption.

---

## 5. Database & Dual-Engine ORM (Drizzle)

The database architecture is located under `src/database/`:

```
src/database/
├── database.js          # Main database entrypoint (selects SQLite or Postgres)
├── index.js             # SQLite connection opener (WAL mode, foreign keys, migrations)
├── migrate.js           # CLI migration script
└── schema/
    ├── sqlite/          # SQLite Drizzle tables (users, menu_items, orders, order_items)
    └── postgres/        # PostgreSQL Drizzle tables
```

### Table Schemas (SQLite & Postgres Parity)

1. **`users`**:
   - `id`: Integer primary key (auto-increment).
   - `username`: Text, unique index.
   - `password_hash`: Text.
   - `role`: Text (`'admin'` or `'cashier'`), default `'cashier'`.
   - `created_at`: Integer timestamp (ms).

2. **`menu_items`**:
   - `id`: Integer primary key.
   - `name`: Text, unique.
   - `price_cents`: Integer (stored in cents to prevent floating point inaccuracies).
   - `category`: Text (e.g. `'Coffee'`, `'Food'`, `'Beverage'`), default `'Food'`.
   - `active`: Boolean/Integer, default `true`.
   - `created_at`: Integer timestamp (ms).

3. **`orders`**:
   - `id`: Integer primary key.
   - `user_id`: Integer foreign key referencing `users.id`.
   - `status`: Text (`'open'`, `'paid'`, `'cancelled'`), default `'open'`.
   - `total_cents`: Integer.
   - `created_at`: Integer timestamp (ms).

4. **`order_items`**:
   - `id`: Integer primary key.
   - `order_id`: Integer foreign key referencing `orders.id` (cascade delete).
   - `menu_item_id`: Integer foreign key referencing `menu_items.id`.
   - `quantity`: Integer.
   - `unit_price_cents`: Integer.

---

## 6. How to Add a New Feature (Developer Recipe)

To add a new feature (for example, a **Coupons / Discounts** feature), follow this linear 5-step recipe:

### Step 1: Define Database Schema & Generate Migration
Create the schema file in `src/database/schema/sqlite/coupons.js`:
```javascript
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const coupons = sqliteTable("coupons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
```
Export it from `src/database/schema/sqlite/index.js`, then run:
```bash
pnpm db:generate:sqlite
```

### Step 2: Create Zod Schema Validation
In `src/features/coupons/coupons.schema.js`:
```javascript
import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(3).max(20),
  discountPercent: z.number().int().min(1).max(100),
});
```

### Step 3: Implement Repository
In `src/features/coupons/coupons.repository.js`:
```javascript
import { eq } from "drizzle-orm";

export function createCouponRepository({ db, schema }) {
  const { coupons } = schema;
  return {
    async findByCode(code) {
      const [row] = await db.select().from(coupons).where(eq(coupons.code, code));
      return row || null;
    },
    async create(data) {
      const [created] = await db.insert(coupons).values(data).returning();
      return created;
    },
  };
}
```

### Step 4: Implement Domain Service
In `src/services/coupons.service.js` (and export from `src/services/index.js`):
```javascript
export function createCouponService(couponRepo) {
  return {
    async validateCoupon(code) {
      const coupon = await couponRepo.findByCode(code);
      if (!coupon || !coupon.active) {
        throw new Error("Invalid or expired coupon");
      }
      return coupon;
    },
  };
}
```

### Step 5: Mount Controller & Router
In `src/features/coupons/coupons.router.js`:
```javascript
import express from "express";
import inputValidationBody from "../../middlewares/validation.middleware.js";
import { isLoggedIn, isAdmin } from "../../middlewares/auth.middleware.js";

const couponRouter = express.Router();
// mount controller endpoints...
export default couponRouter;
```
Mount in `src/routes/main.route.js`:
```javascript
mainRouter.use("/coupons", couponRouter);
```

---

## 7. Security & Middlewares

### 1. In-Memory Rate Limiter (`rate-limit.middleware.js`)
* Protects `/api/auth/login` and `/api/auth/signup` against credential brute-forcing.
* Maintains a lightweight sliding window map of client IPs with automated garbage collection.
* Bypassed automatically during test runs unless `enableInTest: true`.

### 2. Authentication & Role Authorization (`auth.middleware.js`)
* `isLoggedIn`: Extracts JWT from either the `Authorization: Bearer <token>` header or the `accessToken` HTTP-only cookie. Rejects invalid tokens with HTTP 401.
* `isAdmin`: Ensures the authenticated user possesses `user.role === "admin"`. Rejects non-admin staff with HTTP 403 Forbidden.

### 3. Zod Input Validation (`validation.middleware.js`)
* Validates `req.body` against a declared Zod schema.
* On validation failure, returns HTTP 400 with structured issue paths and messages.

---

## 8. Maintenance, Testing & Troubleshooting

### Running Tests
The backend uses Node's native test runner without third-party test framework overhead:
```bash
# Run all backend tests sequentially (preserves SQLite isolation)
pnpm test
```
Current test suite covers:
* `test/auth/auth.test.js`: Login, signup, invalid credentials, duplicate users, cookie auth.
* `test/auth/rate-limit.test.js`: Throttling thresholds and 429 response enforcement.
* `test/menu/menu.test.js`: Item creation, validation, catalog listings, deletions.
* `test/orders/orders.test.js`: Atomic order creation, price verification, status transitions (`open` -> `paid`).
* `test/dashboard/dashboard.test.js`: Today KPIs, order counts, revenue aggregation.

### Common Troubleshooting Scenarios

1. **`SqliteError: table already exists` during startup**:
   - Drizzle's `openDatabase()` in `src/database/index.js` wraps `migrateSqlite()` with an error defense catching `already exists`. If your database file was created prior to Drizzle migration tracking, it skips re-running conflicting creation queries safely.
2. **`MODULE_NOT_FOUND` or ABI Mismatches in Electron**:
   - Electron requires native binary addons compiled for Electron's Node ABI. Ensure the desktop post-package script `scripts/inject-native.js` runs to inject the Electron ABI 140 binary for `better-sqlite3`.
3. **`Warning: Module type of ... is not specified`**:
   - The backend is strictly an ES Module. Ensure `package.json` contains `"type": "module"`. When bundling for Electron ASAR, include `backend/package.json` in `electron-builder` files mapping.
