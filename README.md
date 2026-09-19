# Desktop App Revisited

A deliberately small restaurant order-management application used as a learning laboratory for:

- React frontend
- Node/Express backend
- SQLite local database
- authentication and roles
- SaaS/cloud deployment
- Electron desktop packaging
- offline-first local mode
- installer creation
- code signing concepts
- release publishing
- remote update checks
- database migrations and backups
- CI/CD release workflow

## Core rule

The business application is intentionally boring. The difficult/educational parts are the **deployment modes and desktop lifecycle**, not an over-engineered CRUD architecture.

## Target product

Restaurant Order Manager:

- users can log in
- admin manages menu items
- cashier creates orders
- orders contain menu items and quantities
- order totals are calculated
- orders can be marked paid/cancelled
- dashboard shows today's orders and revenue

## Two modes

### SaaS

```text
Browser
  -> React
  -> HTTPS
  -> Express API
  -> PostgreSQL
```

### Desktop

```text
Electron
  -> React
  -> controlled IPC
  -> Node service
  -> SQLite
```

The desktop build does not require a remote server for normal operation.

## Important boundary

Do not put a private signing key, production secrets, or real customer data into this repository.

The repository contains development/demo signing instructions and placeholders only.
# Scripts

Expected future scripts:

```text
dev
test
db:migrate
db:seed
desktop:dev
desktop:package
desktop:make
desktop:publish
```

Keep scripts thin and obvious.

# Desktop App Revisited

## Restaurant Order Manager

This is a **real-code learning laboratory** for turning a normal full-stack web application into a distributable offline desktop product.

The business domain is intentionally simple:

```text
Users
Menu
Orders
Dashboard
```

The engineering around it is the hard part.

---

# What this project teaches

```text
React
Express
SQLite
Authentication
Authorization
Electron
IPC
Preload
Context Isolation
Filesystem
Application data
Database migrations
Backup/restore
First-run setup
Windows installer
NSIS
Code signing
GitHub Releases
CI/CD
Remote updates
Application lifecycle
SaaS architecture
```

---

# Architecture

## Web

```text
Browser
   |
 React
   |
 HTTPS
   |
Express
   |
PostgreSQL
```

## Desktop

```text
                 Electron
              /            \
             /              \
       React renderer      Main process
                              |
                           preload/IPC
                              |
                         Node services
                              |
                           SQLite
```

The desktop application **does not start an HTTP backend**.

Instead:

```text
React
  -> preload
  -> IPC
  -> same Node service layer
  -> SQLite
```

The SaaS version can use:

```text
React
  -> HTTP
  -> Express
  -> same service layer
  -> PostgreSQL
```

This deliberately keeps the business logic simple.

---

# Actual desktop code

Start here:

```text
apps/desktop/src/main.js
apps/desktop/src/preload.js
apps/desktop/package.json
```

Then read:

```text
docs/19-actual-code-tour.md
docs/20-why-these-files-exist.md
```

Those files explain the code line-by-line at the architectural level.

---

# Installation

```bash
npm install
npm run build
npm run desktop:dev
```

For a Windows installer:

```bash
npm run build
npm run desktop:package
```

Output:

```text
apps/desktop/dist/
```

---

# Demo account

```text
username: admin
password: admin123
```

This is development/demo data only.

---

# Releases

A release eventually becomes:

```text
git tag v0.1.0
      |
      v
GitHub Actions
      |
      +--> tests
      |
      +--> React build
      |
      +--> Electron build
      |
      +--> Windows NSIS installer
      |
      +--> code signing
      |
      +--> GitHub Release
```

Then an installed application can check for a newer release and install it.

---

# Important security rule

Never commit:

```text
private signing certificates
signing passwords
production JWT secrets
customer databases
```

Production credentials belong in the CI secret store.

Electron's current documentation explicitly treats packaging, signing, publishing and updating as separate distribution stages, and recommends secure context isolation/preload IPC boundaries for renderer-to-main communication. citeturn0search5turn0search4turn0search2turn0search3

---

# Learning order

```text
01 architecture
02 backend
03 frontend
04 authentication
05 local desktop
06 migrations
07 packaging
08 signing
09 updates
10 first-run installer/setup
11 SaaS
12 CI release
13 security
14 testing
15 troubleshooting
16 release runbook
19 actual code tour
20 why these files exist
```

Do not skip directly to auto-updates.

The updater makes sense only after you understand:

```text
Electron
 -> packaged application
 -> installer
 -> signed artifact
 -> published release
 -> update metadata
 -> downloaded artifact
 -> restart
```
