export function createMenuController(service) {
  async function getMenus(req, res, next) {
    try {
      const items = await service.list();

      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async function getMenu(req, res, next) {
    try {
      const item = await service.get(Number(req.params.id));

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async function createMenu(req, res, next) {
    try {
      const item = await service.create(req.body);

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async function updateMenu(req, res, next) {
    try {
      const item = await service.update(Number(req.params.id), req.body);

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  return {
    getMenus,
    getMenu,
    createMenu,
    updateMenu,
  };
}
