function createVentasService(db) {
  return {
    list: ({ id_sucursal }) => {
      if (id_sucursal) {
        return db.all(
          "SELECT * FROM resumen_ventas WHERE id_sucursal = ? ORDER BY fecha DESC, id DESC",
          [id_sucursal]
        );
      }
      return db.all("SELECT * FROM resumen_ventas ORDER BY fecha DESC, id DESC");
    },
    create: async (payload) => {
      const result = await db.run(
        "INSERT INTO resumen_ventas (monto_total, cantidad_transacciones, fecha, id_sucursal) VALUES (?, ?, ?, ?)",
        [
          payload.monto_total,
          payload.cantidad_transacciones,
          payload.fecha,
          payload.id_sucursal,
        ]
      );
      return db.get("SELECT * FROM resumen_ventas WHERE id = ?", [result.lastID]);
    },
  };
}

module.exports = { createVentasService };
