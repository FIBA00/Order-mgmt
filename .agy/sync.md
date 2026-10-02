# Swarm Traffic Control

## Active Locks (Editing Now)

- [ ] Backend: Idle
- [x] Frontend: Implementing Phase 2 (Initial Setup & Signup Flow + Admin Staff Provisioning Console)
- [ ] Desktop: Idle
- [ ] QA: Idle

## Cross-Agent Requests & Status

- **Frontend -> Backend**: [RESOLVED] `/api/auth`, `/api/orders`, and `/api/dashboard` mounted in `app/backend/src/routes/main.route.js`.
- **Frontend -> Backend (Feature Suggestions)**: Admin staff & store management requires:
  1. `GET /api/users` (admin-only list of staff/cashiers).
  2. `POST /api/users` (or admin staff provisioning) and `DELETE /api/users/:id`.
  3. Database relations & schemas for store profile (`/api/shop`) and financial ledgers (`/api/finance`).
- **Desktop -> Backend**: [RESOLVED] CommonJS DB and service adapters operational for Electron IPC.
- **Desktop -> Frontend**: [RESOLVED] Desktop app bundles production build from `app/frontend/dist` with offline IPC parity.


