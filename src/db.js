const fs = require("node:fs");
const path = require("node:path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { databaseFile } = require("./config");

let db;

async function connectDatabase() {
  if (db) return db;

  const absolutePath = path.resolve(databaseFile);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  db = await open({
    filename: absolutePath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

async function closeDatabase() {
  if (db) {
    await db.close();
    db = undefined;
  }
}

module.exports = { connectDatabase, closeDatabase };