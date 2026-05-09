function createDashboardController(service) {
  return {
    getSummary: async (_req, res, next) => {
      try {
        const data = await service.getSummary();
        return res.json(data);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createDashboardController };
