# Authentication

## SaaS

```text
Browser
 -> POST /login
 -> server validates password
 -> server creates session
 -> browser stores only the session mechanism
```

Use secure password hashing such as Argon2id or bcrypt.

Use server-side sessions for the simple teaching implementation.

## Desktop

There is no remote authentication server.

The local database contains users and password hashes.

```text
React
 -> IPC
 -> auth service
 -> SQLite
```

A local session can be kept in memory by the desktop process.

## Roles

Two roles are enough:

```text
admin
cashier
```

Admin:

- manage menu
- view dashboard
- manage users

Cashier:

- create orders
- view orders
- update order status

## Security warning

Local authentication is access control, not protection against the owner of the computer. 
A user with administrative filesystem access can potentially inspect or replace local application data.
