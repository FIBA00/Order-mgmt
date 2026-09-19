# Backend

The backend is intentionally conventional.

## Responsibilities

```text
routes
  -> validation
  -> service
  -> database
```

Do not create repositories, dependency-injection containers, event buses, CQRS, or microservices for this project.

## API

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/menu
POST   /api/menu
PATCH  /api/menu/:id
DELETE /api/menu/:id

GET    /api/orders
GET    /api/orders/:id
POST   /api/orders
PATCH  /api/orders/:id/status

GET    /api/dashboard
```

## Database

```text
users
menu_items
orders
order_items
sessions
```

## Business rule

The order total is computed on the server/service layer. Never trust a total sent by the React client.

## Desktop adaptation

The same service functions should be usable without requiring TCP networking.

That means the business logic should not depend on `req`/`res` objects.
