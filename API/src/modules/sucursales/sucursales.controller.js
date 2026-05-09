function createSucursalesController(service) {
  return {
    list: async (_req, res, next) => {
      try {
        const rows = await service.list();
        return res.json(rows);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createSucursalesController };
