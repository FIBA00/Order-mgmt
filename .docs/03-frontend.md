# Frontend

Use:

- React
- Vite
- JSX
- Tailwind CSS
- React Router
- a small fetch/API client

Do not introduce Redux, Zustand, React Query, or a custom design system unless the project actually needs them.

## Screens

```text
/login

/
/dashboard
/menu
/orders
/orders/new
/orders/:id
/settings
```

## Desktop considerations

The UI should not care whether data came from:

```text
HTTP
```

or:

```text
Electron IPC
```

Use a small `api` interface.

Example conceptual interface:

```js
api.menu.list()
api.orders.create(data)
api.auth.login(credentials)
```

The implementation can be HTTP in SaaS mode and IPC/local service in desktop mode.
