const { AppError } = require("../../lib/app-error");

function createOportunidadesService(db) {
  function formatDate(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  function isWonStage(etapa) {
    return String(etapa).toLowerCase() === "ganado";
  }

  async function recordSaleIfWon(valorEstimado) {
    const today = new Date();
    const year = String(today.getFullYear());
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const currentDate = formatDate(today);

    const summary = await db.get(
      "SELECT * FROM resumen_ventas WHERE strftime('%Y', fecha) = ? AND strftime('%m', fecha) = ? AND id_sucursal IS NULL",
      [year, month]
    );

    if (summary) {
      await db.run(
        "UPDATE resumen_ventas SET monto_total = monto_total + ?, cantidad_transacciones = cantidad_transacciones + 1 WHERE id = ?",
        [valorEstimado, summary.id]
      );
    } else {
      await db.run(
        "INSERT INTO resumen_ventas (monto_total, cantidad_transacciones, fecha, id_sucursal) VALUES (?, ?, ?, NULL)",
        [valorEstimado, 1, currentDate]
      );
    }
  }

  return {
    list: ({ cliente_id }) => {
      if (cliente_id) {
        return db.all(
          "SELECT * FROM oportunidades_venta WHERE cliente_id = ? ORDER BY fecha_creacion DESC",
          [cliente_id]
        );
      }
      return db.all("SELECT * FROM oportunidades_venta ORDER BY fecha_creacion DESC");
    },
    create: async (payload) => {
      await db.exec("BEGIN TRANSACTION;");
      try {
        const result = await db.run(
          "INSERT INTO oportunidades_venta (cliente_id, titulo, descripcion, valor_estimado, etapa, fecha_cierre_estimada) VALUES (?, ?, ?, ?, ?, ?)",
          [
            payload.cliente_id,
            payload.titulo,
            payload.descripcion,
            payload.valor_estimado,
            payload.etapa,
            payload.fecha_cierre_estimada,
          ]
        );
        const row = await db.get("SELECT * FROM oportunidades_venta WHERE id = ?", [result.lastID]);
        if (isWonStage(row.etapa)) {
          await recordSaleIfWon(row.valor_estimado);
        }
        await db.exec("COMMIT;");
        return row;
      } catch (error) {
        await db.exec("ROLLBACK;");
        throw error;
      }
    },
    update: async (id, payload) => {
      const existing = await db.get(
        "SELECT * FROM oportunidades_venta WHERE id = ?",
        [id]
      );
      if (!existing) {
        throw new AppError(404, "Oportunidad no encontrada");
      }

      const updated = {
        ...existing,
        ...payload,
        fecha_actualizacion: formatDate(new Date()),
      };

      const columns = [];
      const params = [];

      Object.entries(updated).forEach(([key, value]) => {
        if (key !== "id") {
          columns.push(`${key} = ?`);
          params.push(value);
        }
      });

      params.push(id);

      await db.exec("BEGIN TRANSACTION;");
      try {
        await db.run(
          `UPDATE oportunidades_venta SET ${columns.join(", ")} WHERE id = ?`,
          params
        );

        if (!isWonStage(existing.etapa) && isWonStage(updated.etapa)) {
          await recordSaleIfWon(updated.valor_estimado);
        }

        const row = await db.get("SELECT * FROM oportunidades_venta WHERE id = ?", [id]);
        await db.exec("COMMIT;");
        return row;
      } catch (error) {
        await db.exec("ROLLBACK;");
        throw error;
      }
    },
  };
}

module.exports = { createOportunidadesService };
