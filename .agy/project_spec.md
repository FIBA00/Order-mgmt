# Menu Management System - Project Specification

## 1. Executive Summary & Overview

Simple menu management system for resturants and cafes local desktop app.
---

## 2. System Architecture & Workflows

### 4.1 Offline-First Workflow & Data Sync

- **Offline Operations**: the app must work without active internet connectivity.
- **Local Persistence**: All transaction records created offline are stored securely in local device storage.
- **Automatic Sync**: Upon restoring network connection, client devices automatically synchronize offline data with the central backend server.

### 4.2 Technology Stack

- **Frontend**: React.js, Tailwind CSS, JavaScript
- **Backend**: Express Js / Node.js Express API, JSON REST APIs
- **Database**: Postgresql / Relational Database/ Mobile version sqlite
- **Desktop**: sqlite database with the react native
