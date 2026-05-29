const { AppError } = require("../../lib/app-error");

function createClientesService(db) {
  return {
    list: ({ estado, cliente_id }) => {
      if (cliente_id) {
        return db.all(
          "SELECT * FROM clientes WHERE id = ? ORDER BY fecha_registro DESC",
          [cliente_id]
        );
      }
      if (estado) {
        return db.all(
          "SELECT * FROM clientes WHERE estado = ? ORDER BY fecha_registro DESC",
          [estado]
        );
      }
      return db.all("SELECT * FROM clientes ORDER BY fecha_registro DESC");
    },
    create: async (payload) => {
      const result = await db.run(
        "INSERT INTO clientes (nombre_empresa, rtn, nombre_contacto, correo, telefono, direccion, estado) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          payload.nombre_empresa,
          payload.rtn,
          payload.nombre_contacto,
          payload.correo,
          payload.telefono,
          payload.direccion,
          payload.estado,
        ]
      );
      return db.get("SELECT * FROM clientes WHERE id = ?", [result.lastID]);
    },
    update: async (id, payload) => {
      const existing = await db.get("SELECT * FROM clientes WHERE id = ?", [id]);
      if (!existing) {
        throw new AppError(404, "Cliente no encontrado");
      }

      const updated = { ...existing, ...payload };
      const columns = [];
      const params = [];

      Object.entries(updated).forEach(([key, value]) => {
        if (key !== "id") {
          columns.push(`${key} = ?`);
          params.push(value);
        }
      });
      params.push(id);

      await db.run(`UPDATE clientes SET ${columns.join(", ")} WHERE id = ?`, params);
      return db.get("SELECT * FROM clientes WHERE id = ?", [id]);
    },
    deactivate: async (id) => {
      const existing = await db.get("SELECT * FROM clientes WHERE id = ?", [id]);
      if (!existing) {
        throw new AppError(404, "Cliente no encontrado");
      }

      await db.run("UPDATE clientes SET estado = ? WHERE id = ?", ["Inactivo", id]);
      return db.get("SELECT * FROM clientes WHERE id = ?", [id]);
    },
  };
}

module.exports = { createClientesService };
