# Changelog

All notable changes to the Restaurant Order Manager project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-24

### Added
- **Internationalization (i18n)**:
  - English (`en`) and Amharic (`am`) language support via `i18next` and `react-i18next`.
  - Minimal language switcher component with Globe icon and persistent selection (`localStorage`).
  - Full translation of POS navigation tabs, order management actions, receipt headers, and auth views.
- **Finances & Reporting Suite**:
  - Dedicated `/finances` console restricted to administrators.
  - Gross revenue, average ticket value, pending tickets, and cancelled ticket metric cards.
  - Channel split (Dine-In vs Takeaway) and cashier sales performance breakdown.
  - Searchable, filterable transaction ledger with auto-refresh.
  - Client-side 80mm POS thermal receipt generation and printable A4 executive PDF reports using `jspdf` and `jspdf-autotable`.
- **Role Isolation & Admin Management**:
  - Role-based access control distinguishing `admin` and `cashier` users.
  - Staff management console at `/admin` for provisioning and deactivating staff accounts.
  - Safe foreign-key deletion guards preventing removal of staff with sales history (409 Conflict).
- **Custom Menu Management**:
  - Dedicated `/menu` management console with category filtering.
  - On-the-fly item creation and editing modal supporting standard and custom categories.
  - Soft-delete handling preserving historical orders when menu items are retired.
- **Desktop & Offline Resilience**:
  - Frameless modern window with drag-to-move titlebar and custom window controls.
  - Local SQLite database using Drizzle ORM migrations with zero raw SQL.
  - Offline sync queue automatically flushing queued orders when connectivity is restored.
  - Structured clone date compatibility across IPC channels.
- **Lucide Icons**:
  - Complete migration from raw emojis to modern, accessible SVG Lucide icons across all screens.
- **CI/CD & Automation**:
  - Multi-platform packaging workflow for Linux (AppImage, deb, tarball) and Windows (nsis).
  - GitHub Actions CI pipeline running 90 automated tests across backend, desktop, and frontend.

### Fixed
- Fixed SQLite `timestamp_ms` Date instance handling in `FinancesPage` and offline dashboard calculations preventing blank-screen render crashes.
- Fixed CORS headers in backend for `DELETE` and `PUT` preflight requests.
- Fixed legacy CommonJS test runner references in CI environment.
- Fixed session persistence to avoid unexpected logouts on browser refresh.
