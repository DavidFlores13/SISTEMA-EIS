function createSucursalesService(db) {
  return {
    list: () => db.all("SELECT * FROM sucursales ORDER BY id"),
  };
}

module.exports = { createSucursalesService };
