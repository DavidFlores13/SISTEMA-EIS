function createDashboardService(db) {
  return {
    async getSummary() {
      const [ventas, gastos, metas] = await Promise.all([
        db.get("SELECT COALESCE(SUM(monto_total), 0) AS total FROM resumen_ventas"),
        db.get("SELECT COALESCE(SUM(monto), 0) AS total FROM gastos_operativos"),
        db.get("SELECT COALESCE(SUM(valor_objetivo), 0) AS total FROM metas_empresariales"),
      ]);

      const totalVentas = Number(ventas.total || 0);
      const totalGastos = Number(gastos.total || 0);

      return {
        total_ventas: totalVentas,
        total_gastos: totalGastos,
        utilidad_neta: totalVentas - totalGastos,
        total_metas: Number(metas.total || 0),
      };
    },
  };
}

module.exports = { createDashboardService };
