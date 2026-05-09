function createMetasService(db) {
  return {
    list: ({ id_sucursal, anio, mes }) => {
      let sql = "SELECT * FROM metas_empresariales WHERE 1 = 1";
      const params = [];

      if (id_sucursal) {
        sql += " AND id_sucursal = ?";
        params.push(id_sucursal);
      }
      if (anio) {
        sql += " AND anio = ?";
        params.push(anio);
      }
      if (mes) {
        sql += " AND mes = ?";
        params.push(mes);
      }

      sql += " ORDER BY anio DESC, mes DESC, id DESC";
      return db.all(sql, params);
    },
    create: async (payload) => {
      const result = await db.run(
        "INSERT INTO metas_empresariales (nombre_kpi, valor_objetivo, mes, anio, id_sucursal) VALUES (?, ?, ?, ?, ?)",
        [
          payload.nombre_kpi,
          payload.valor_objetivo,
          payload.mes,
          payload.anio,
          payload.id_sucursal,
        ]
      );
      return db.get("SELECT * FROM metas_empresariales WHERE id = ?", [result.lastID]);
    },
  };
}

module.exports = { createMetasService };
