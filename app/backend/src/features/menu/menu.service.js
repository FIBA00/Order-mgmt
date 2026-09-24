export function createMenuService(repository) {
  async function list() {
    return repository.findAll();
  }

  async function get(id) {
    const item = await repository.findById(id);

    if (!item) {
      throw createError("Menu item not found", 404);
    }

    return item;
  }

  async function create(data) {
    return repository.create({
      name: data.name,
      priceCents: data.priceCents,
    });
  }

  async function update(id, data) {
    await get(id);

    return repository.update(id, data);
  }

  async function setActive(id, active) {
    await get(id);

    return repository.setActive(id, active);
  }

  return {
    list,
    get,
    create,
    update,
    setActive,
  };
}

function createError(message, statusCode) {
  const error = new Error(message);

  error.statusCode = statusCode;

  return error;
}
