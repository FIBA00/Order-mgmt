# Data, Migrations, Backups

Desktop software has a special problem:

**the application gets updated while its database survives.**

Example:

```text
v1.0 database
     |
     | install v1.1
     v
migration 001 -> 002
     |
v1.1 database
```

Never silently overwrite the user's database.

## Migration table

Keep:

```text
schema_migrations
```

with migration IDs.

At startup:

```text
current schema
      |
find pending migrations
      |
run transaction
      |
record migration
```

## Backup

Provide:

```text
Settings
  -> Backup
  -> Restore
```

A simple SQLite backup can be copied while using an appropriate SQLite backup procedure; 
do not blindly copy a live database in more complex production situations.

## Before migration

For important releases:

```text
backup
  -> migrate
  -> launch
```

If migration fails, preserve the backup.

## Export

Also support a human-readable export such as JSON/CSV for business data. 
This is separate from a full database backup.
