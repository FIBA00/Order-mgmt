# SaaS Mode

The same business domain can become a SaaS product.

## SaaS architecture

```text
React
  |
HTTPS
  |
Express
  |
PostgreSQL
```

## Multi-tenancy

Add:

```text
organizations
users
organization_users
```

Business records receive an organization ID:

```text
menu_items.organization_id
orders.organization_id
```

Every authenticated request resolves:

```text
user -> organization -> data
```

Never trust an organization ID supplied directly by the browser.

## Desktop version

The desktop build can be single-tenant:

```text
one installation
one restaurant
one local database
```

This keeps the offline version simple.

## Future hybrid

Eventually:

```text
desktop SQLite
      |
      | optional synchronization
      v
SaaS PostgreSQL
```

Do not implement sync in the first version. It is a separate distributed-systems problem.
