const { calculateMonthlyGrowth } = require("./kpis.schemas");

function createKpisService(db) {
  return {
    async getMonthlyGrowth() {
      const rows = await db.all(
        `
        SELECT strftime('%Y-%m', fecha) AS periodo, SUM(monto_total) AS total
        FROM resumen_ventas
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY periodo ASC
      `
      );

      return calculateMonthlyGrowth(rows);
    },

    async getStatus({ anio, mes, id_sucursal }) {
      let ventasFilter = "strftime('%Y', rv.fecha) = ? AND strftime('%m', rv.fecha) = ?";
      const ventasParams = [String(anio), String(mes).padStart(2, "0")];

      let metasFilter = "me.anio = ? AND me.mes = ?";
      const metasParams = [anio, mes];

      if (id_sucursal) {
        ventasFilter += " AND rv.id_sucursal = ?";
        metasFilter += " AND me.id_sucursal = ?";
        ventasParams.push(id_sucursal);
        metasParams.push(id_sucursal);
      }

      const [ventas, metas] = await Promise.all([
        db.get(
          `SELECT COALESCE(SUM(rv.monto_total), 0) AS total_real FROM resumen_ventas rv WHERE ${ventasFilter}`,
          ventasParams
        ),
        db.get(
          `SELECT COALESCE(SUM(me.valor_objetivo), 0) AS total_meta FROM metas_empresariales me WHERE ${metasFilter}`,
          metasParams
        ),
      ]);

      const totalReal = Number(ventas.total_real || 0);
      const totalMeta = Number(metas.total_meta || 0);
      const cumplimientoPct = totalMeta === 0 ? 0 : (totalReal / totalMeta) * 100;

      let estado = "rojo";
      if (cumplimientoPct >= 100) estado = "verde";
      else if (cumplimientoPct >= 80) estado = "amarillo";

      return {
        periodo: { anio: Number(anio), mes: Number(mes) },
        id_sucursal: id_sucursal ? Number(id_sucursal) : null,
        total_real: totalReal,
        total_meta: totalMeta,
        cumplimiento_pct: Number(cumplimientoPct.toFixed(2)),
        estado,
      };
    },
  };
}

module.exports = { createKpisService };
