src/
│
├── database/
│   │
│   ├── database.js              ← selects DB + schema
│   ├── migrate.js
│   │
│   └── schema/
│       ├── sqlite/
│       │   ├── index.js
│       │   ├── users.js
│       │   ├── menu-items.js
│       │   ├── orders.js
│       │   └── order-items.js
│       │
│       └── postgres/
│           ├── index.js
│           ├── users.js
│           ├── menu-items.js
│           ├── orders.js
│           └── order-items.js
│
├── features/
│   │
│   ├── menu/
│   │   ├── menu.repository.js    ← DB
│   │   ├── menu.service.js       ← business logic
│   │   ├── menu.ctrl.js          ← HTTP
│   │   ├── menu.router.js
│   │   └── menu.schema.js        ← Zod/API contract
│   │
│   ├── auth/
│   │   ├── auth.repository.js
│   │   ├── auth.service.js
│   │   ├── auth.ctrl.js
│   │   ├── auth.router.js
│   │   └── auth.schema.js
│   │
│   └── orders/
│       ├── orders.repository.js
│       ├── orders.service.js
│       ├── orders.ctrl.js
│       ├── orders.router.js
│       └── orders.schema.js
│
├── middlewares/
├── routes/
└── server.js

- Pattern of repo and service

```js
export function createSomethingRepository({ db, schema }) {
  const { something } = schema;

  async function findAll() {
    // Drizzle
  }

  async function findById(id) {
    // Drizzle
  }

  async function create(data) {
    // Drizzle
  }

  async function update(id, data) {
    // Drizzle
  }

  async function remove(id) {
    // Drizzle
  }

  return {
    findAll,
    findById,
    create,
    update,
    remove,
  };
}

export function createSomethingService(repository) {
  async function list() {
    return repository.findAll();
  }

  async function create(data) {
    // business rules

    return repository.create(data);
  }

  async function update(id, data) {
    // business rules

    return repository.update(id, data);
  }

  return {
    list,
    create,
    update,
  };
}

```