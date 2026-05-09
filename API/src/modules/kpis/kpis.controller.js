function createKpisController(service) {
  return {
    getMonthlyGrowth: async (_req, res, next) => {
      try {
        const data = await service.getMonthlyGrowth();
        return res.json(data);
      } catch (error) {
        return next(error);
      }
    },

    getStatus: async (req, res, next) => {
      try {
        const data = await service.getStatus(req.query);
        return res.json(data);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createKpisController };
