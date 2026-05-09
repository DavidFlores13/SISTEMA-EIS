const sqlite3 = require("sqlite3").verbose();

function createDb(dbPath) {
  const connection = new sqlite3.Database(dbPath);

  connection.serialize(() => {
    connection.run("PRAGMA foreign_keys = ON");
  });

  return {
    all(sql, params = []) {
      return new Promise((resolve, reject) => {
        connection.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      });
    },
    get(sql, params = []) {
      return new Promise((resolve, reject) => {
        connection.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
    },
    run(sql, params = []) {
      return new Promise((resolve, reject) => {
        connection.run(sql, params, function onRun(err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    exec(sql) {
      return new Promise((resolve, reject) => {
        connection.exec(sql, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
    close() {
      return new Promise((resolve, reject) => {
        connection.close((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    },
  };
}

module.exports = { createDb };
