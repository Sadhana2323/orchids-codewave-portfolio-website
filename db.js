const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'codewave.db');

let db; // sql.js Database instance

/** Save the in-memory database to disk. */
function save() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

/**
 * Mimic the better-sqlite3 prepare() API so the rest of the
 * application code can keep using  db.prepare(sql).get / .run.
 */
function prepare(sql) {
  return {
    /** Return the first matching row (or undefined). */
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      let row;
      if (stmt.step()) {
        row = stmt.getAsObject();
      }
      stmt.free();
      return row || undefined;
    },

    /** Execute an INSERT / UPDATE / DELETE and persist to disk. */
    run(...params) {
      db.run(sql, params);
      save();
      return { changes: db.getRowsModified() };
    },

    /** Return ALL matching rows. */
    all(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    }
  };
}

/**
 * Initialise (or open) the database.
 * Must be awaited before the server starts accepting requests.
 */
async function initDB() {
  const SQL = await initSqlJs();

  // Load existing database file if present
  let fileBuffer;
  try {
    fileBuffer = fs.readFileSync(dbPath);
  } catch (_) {
    // first run – file does not exist yet
  }

  db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();

  // Create tables (idempotent)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  save(); // persist the schema to disk
}

module.exports = { initDB, prepare };
