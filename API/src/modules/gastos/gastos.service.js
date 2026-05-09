function createGastosService(db) {
  return {
    list: ({ id_sucursal }) => {
      if (id_sucursal) {
        return db.all(
          "SELECT * FROM gastos_operativos WHERE id_sucursal = ? ORDER BY fecha DESC, id DESC",
          [id_sucursal]
        );
      }
      return db.all("SELECT * FROM gastos_operativos ORDER BY fecha DESC, id DESC");
    },
    create: async (payload) => {
      const result = await db.run(
        "INSERT INTO gastos_operativos (categoria, monto, fecha, id_sucursal) VALUES (?, ?, ?, ?)",
        [payload.categoria, payload.monto, payload.fecha, payload.id_sucursal]
      );
      return db.get("SELECT * FROM gastos_operativos WHERE id = ?", [result.lastID]);
    },
  };
}

module.exports = { createGastosService };
