// Este controlador es la pieza más importante del backend porque aquí unimos el mundo del CRM con el EIS.
// Cuando una oportunidad cambia su etapa a "Ganado", el sistema actualiza automáticamente el resumen de ventas
// del mes y año actuales en la tabla `resumen_ventas`.
function createOportunidadesController(service) {
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
    update: async (req, res, next) => {
      try {
        const row = await service.update(Number(req.params.id), req.body);
        return res.json(row);
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createOportunidadesController };
