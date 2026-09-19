# Learning Map

This project is a laboratory. Read the documents in this order.

1. `01-architecture.md` — understand the complete system.
2. `02-backend.md` — deliberately small API and database.
3. `03-frontend.md` — React application.
4. `04-authentication.md` — sessions, passwords, roles.
5. `05-local-desktop.md` — Electron + local SQLite.
6. `06-data-and-migrations.md` — desktop data lifecycle.
7. `07-packaging.md` — executable and installer.
8. `08-signing.md` — certificates and private keys.
9. `09-updates.md` — remote release checking and update flow.
10. `10-installation-and-first-run.md` — setup wizard / initialization.
11. `11-saas.md` — turn the same business app into SaaS.
12. `12-ci-release.md` — build, sign, publish, update.
13. `13-security.md` — desktop-specific security.
14. `14-testing.md` — what should be tested.
15. `15-troubleshooting.md` — common failures.

## Suggested implementation order

### Stage A — ordinary web app

React + Express + SQLite first.

### Stage B — authentication

Login, password hashing, sessions, roles.

### Stage C — SaaS variant

Swap local SQLite for PostgreSQL and deploy the API.

### Stage D — desktop

Embed the same React application in Electron and expose local operations through IPC.

### Stage E — distribution

Package -> installer -> signing -> release.

### Stage F — updates

Check release metadata -> download -> verify/sign -> install -> restart.

### Stage G — production discipline

Backups -> migrations -> rollback -> CI/CD -> release channels.
