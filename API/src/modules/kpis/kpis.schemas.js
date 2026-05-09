const { z } = require("zod");

const estadoKpiQuerySchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2200),
  mes: z.coerce.number().int().min(1).max(12),
  id_sucursal: z.coerce.number().int().positive().optional(),
});

function calculateMonthlyGrowth(rows) {
  return rows.map((row, index) => {
    const total = Number(row.total || 0);
    if (index === 0) {
      return {
        periodo: row.periodo,
        total,
        crecimiento_pct: null,
      };
    }

    const prev = Number(rows[index - 1].total || 0);
    const growth = prev === 0 ? null : ((total - prev) / prev) * 100;

    return {
      periodo: row.periodo,
      total,
      crecimiento_pct: growth === null ? null : Number(growth.toFixed(2)),
    };
  });
}

module.exports = { estadoKpiQuerySchema, calculateMonthlyGrowth };
