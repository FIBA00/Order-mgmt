export function createDashboardController(service) {
  async function getToday(req, res, next) {
    try {
      const stats = await service.today();
      return res.status(200).json({
        success: true,
        dashboard: stats,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  return { getToday };
}
