const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "data");

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

const db = new Database(path.join(dataPath, "database.db"));

db.prepare(
  `CREATE TABLE IF NOT EXISTS quarantine (
    user_id TEXT PRIMARY KEY,
    previous_roles TEXT NOT NULL,
    reason TEXT NOT NULL
);
`,
).run();

db.prepare(
  `CREATE TABLE IF NOT EXISTS staff_results (
    user_id TEXT PRIMARY KEY,
    result TEXT NOT NULL,
    notes TEXT NOT NULL
);
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT "offline",
    started_at INTEGER NOT NULL,
    total_time INTEGER NOT NULL,
    total_shifts INTEGER NOT NULL,
);
  `,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS shift_wave (
    id INTEGER PRIMARY KEY,
    wave_id TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER NOT NULL,
    total_time INTEGER NOT NULL,
    total_shifts INTEGER NOT NULL,
);
  `,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS shifts_breaks (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER NOT NULL,
);
  `,
);

module.exports = db;
