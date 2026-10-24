# Swarm Traffic Control

## Active Locks (Editing Now)

- [ ] Backend: Idle
- [ ] Frontend: Idle (Completed Frontend Documentation Suite in app/frontend/.docs/)
- [ ] Desktop: Idle
- [ ] QA: Idle


## Cross-Agent Requests & Status

- **Order Item List UI & Modal Layout**: [COMPLETED] Order cards in `OrderList.jsx` and vertical matching tabular rows in `OrderDetailsModal.jsx` display full order metadata with eager-loading in backend/desktop repositories.
- **Finances Tab**: [COMPLETED] Dedicated `/finances` admin page with revenue metrics, channel breakdown, and ledger. Cleaned from POS register.
- **Menu Catalog Lockdown**: [COMPLETED] `/menu` restricted to admins only; staff and cashiers only have access to POS ordering and order management.
- **Lucide Icons Migration**: [COMPLETED] Replaced all emojis across navigation, cards, modals, and auth pages with `lucide-react` icons.
- **POS Thermal Receipts & Financial PDF Reports**: [COMPLETED] Replaced window screenshots with `jspdf` and `jspdf-autotable`. Built 80mm thermal receipt generator and A4 multi-page ledger reports with direct print and export downloads. All 83/83 tests passing.
- **CI/CD Pipeline**: [COMPLETED] Configured GitHub Actions `.github/workflows/ci.yml` (push/PR test & build matrix) and `.github/workflows/release.yml` (multi-platform Linux & Windows release). Added root `check` and `test` scripts. Documented in `app/frontend/.docs/DEPLOYMENT_AND_CICD.md`.
- **Frontend Docs**: [COMPLETED] Created comprehensive architecture, component graph, backend trace, and developer guide in `app/frontend/.docs/README.md`.
- **Frontend -> Backend / Desktop**: [RESOLVED] Menu item category persistence across reloads/syncs via `restaurant_menu_categories` and backend schemas.
- **Frontend**: [RESOLVED] Non-admin staff guards on Menu Management catalog actions ("+ Add Menu Item", "✎ Edit", "🗑 Delete").
- **Backend / Desktop**: [RESOLVED] Modularized `services/` into domain files (`auth.service.js`, `menu.service.js`, `orders.service.js`, `dashboard.service.js`) with aggregate `index.js`.
- **Frontend -> Backend**: [RESOLVED] `/api/auth`, `/api/orders`, and `/api/dashboard` mounted in `app/backend/src/routes/main.route.js`.
- **Frontend -> Backend (Feature Suggestions)**: [RESOLVED (Phase 2)] Staff management endpoints (`GET/POST/DELETE /api/auth/users`) mounted and connected with desktop SQLite IPC parity. Phase 3 store profile (`/api/shop`) and Phase 4 financial ledgers (`/api/finance`) queued.
- **Desktop -> Backend**: [RESOLVED] CommonJS DB and service adapters operational for Electron IPC.
- **Desktop -> Frontend**: [RESOLVED] Desktop app bundles production build from `app/frontend/dist` with offline IPC parity.


