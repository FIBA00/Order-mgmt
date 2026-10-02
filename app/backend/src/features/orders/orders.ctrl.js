export function createOrdersController(service) {
  async function getOrders(req, res, next) {
    try {
      const orders = await service.list();
      return res.status(200).json({
        success: true,
        orders,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async function getOrder(req, res, next) {
    try {
      const order = await service.get(Number(req.params.id));
      return res.status(200).json({
        success: true,
        order,
        data: order,
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async function createOrder(req, res, next) {
    try {
      const userId = req.user?.id || 1;
      const order = await service.create(userId, req.body.items);
      return res.status(201).json({
        success: true,
        order,
        data: order,
      });
    } catch (error) {
      if (error.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async function setStatus(req, res, next) {
    try {
      const order = await service.setStatus(
        Number(req.params.id),
        req.body.status,
      );
      return res.status(200).json({
        success: true,
        order,
        data: order,
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  return {
    getOrders,
    getOrder,
    createOrder,
    setStatus,
  };
}
