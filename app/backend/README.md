# Backend

Backend API for the Restaurant Order Management Application using Express and Drizzle ORM.

## Database Support (SQLite vs PostgreSQL)

The backend dynamically supports both **SQLite** and **PostgreSQL** based on the `DATABASE_URL` environment variable configured in `.env` or `.env.local`.

### 1. SQLite Mode (Local / Development)
Set `DATABASE_URL` to a file path ending in `.sqlite` or `.db` (or starting with `file:` / `sqlite:`):

```env
DATABASE_URL=./data/app.sqlite
```

- **Driver:** Uses `better-sqlite3`.
- **Database file:** Automatically created under `./data/app.sqlite` if it does not exist.
- **Migrations:**
  Run `npx drizzle-kit migrate` (or `bash run_migrate.sh`). Drizzle Kit auto-detects `sqlite` dialect and applies schema migrations to your SQLite database.

### 2. PostgreSQL Mode (SaaS / Production)
Set `DATABASE_URL` to a PostgreSQL connection URI:

```env
DATABASE_URL=postgresql://rest_user:supersecretd@localhost:5432/restaurant_db
```

- **Driver:** Uses `pg` (node-postgres).
- **Prerequisite:** PostgreSQL server must be running and target database/user created (`psql -h localhost -U rest_user -d restaurant_db`).
- **Migrations:**
  Run `npx drizzle-kit migrate` (or `bash run_migrate.sh`). Drizzle Kit auto-detects `postgresql` dialect and creates/migrates PostgreSQL tables.

---

## Troubleshooting Common Errors

### Missing Table Errors (`Failed query: select ... from "menu_items"`)
If requests to `/api/menu` fail with:
```log
Error while getting menu items: Failed query: select "id", ... from "menu_items"
```
This indicates the database tables have not been created/migrated yet. Run:
```bash
npx drizzle-kit migrate
```
Ensure `DATABASE_URL` points to the intended database (SQLite or PostgreSQL) before migrating.

---

## API Routes

- `GET /api/menu` / `GET /api/menu/pub` - List all menu items.
- `POST /api/menu` - Create a new menu item.
