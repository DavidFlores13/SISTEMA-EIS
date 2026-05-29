function createInteraccionesService(db) {
  return {
    list: ({ cliente_id }) => {
      if (cliente_id) {
        return db.all(
          "SELECT * FROM interacciones_crm WHERE cliente_id = ? ORDER BY fecha_interaccion DESC",
          [cliente_id]
        );
      }
      return db.all("SELECT * FROM interacciones_crm ORDER BY fecha_interaccion DESC");
    },
    create: async (payload) => {
      const result = await db.run(
        "INSERT INTO interacciones_crm (cliente_id, tipo_interaccion, comentarios, fecha_interaccion) VALUES (?, ?, ?, ?)",
        [
          payload.cliente_id,
          payload.tipo_interaccion,
          payload.comentarios,
          payload.fecha_interaccion,
        ]
      );
      return db.get("SELECT * FROM interacciones_crm WHERE id = ?", [result.lastID]);
    },
  };
}

module.exports = { createInteraccionesService };
