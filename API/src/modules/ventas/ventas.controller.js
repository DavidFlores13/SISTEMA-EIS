function createVentasController(service) {
  return {
    list: async (req, res, next) => {
      try {
        const rows = await service.list(req.query);
        return res.json(rows);
      } catch (error) {
        return next(error);
      }
    },
    create: async (req, res, next) => {
      try {
        const row = await service.create(req.body);
        return res.status(201).json(row);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createVentasController };
