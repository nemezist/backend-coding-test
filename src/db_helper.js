module.exports = (db) => ({
  all: async (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  }),
  run: async (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  }),
});
