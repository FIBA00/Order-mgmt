# Architecture

## Business domain

Keep it intentionally small:

```text
User
MenuItem
Order
OrderItem
```

## Web architecture

```text
                    SaaS
                     |
                 HTTPS API
                     |
                  Express
                     |
                PostgreSQL
```

## Desktop architecture

```text
                 Electron
              /            \
          Renderer          Main
             |               |
           React          Node services
                             |
                           SQLite
```

Renderer code must not receive unrestricted Node.js access.

Use Electron's preload/context-isolation/IPC boundary.

## Why SQLite?

SQLite is an embedded, serverless, zero-configuration database. A complete database can live in one file. That makes it a natural fit for a single-machine/offline application.

## Why not run PostgreSQL locally?

Because the teaching goal is a client that installs like normal software. Requiring the customer to install and administer a database server defeats the point.

## Optional hybrid architecture

Later:

```text
             Internet
                |
       +--------+--------+
       |                 |
     SaaS API        Release API
       |
   PostgreSQL

Desktop
   |
 SQLite
```

A later synchronization layer can be added without changing the business domain.
