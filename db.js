const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "data");

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

const db = new Database(path.join(dataPath, "database.db"));

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS quarantine (
    user_id TEXT PRIMARY KEY,
    previous_roles TEXT NOT NULL,
    reason TEXT NOT NULL
  );
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS staff_results (
    user_id TEXT PRIMARY KEY,
    result TEXT NOT NULL,
    notes TEXT NOT NULL
  );
`,
).run();
db.prepare(
  `
CREATE TABLE IF NOT EXISTS shift_wave (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wave_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    started_at INTEGER NOT NULL,
    ended_at INTEGER
);
`,
).run();

db.prepare(`DROP TABLE IF EXISTS shifts`).run();

db.prepare(
  `
CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id TEXT NOT NULL,
    wave_id TEXT,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'offline',
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    total_time INTEGER NOT NULL DEFAULT 0,
    total_shifts INTEGER NOT NULL DEFAULT 0
);
`,
).run();

db.prepare(
  `
CREATE TABLE IF NOT EXISTS shifts_breaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    duration INTEGER DEFAULT 0
);
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS infractions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    infraction_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    issued_by TEXT NOT NULL,
    issued_at INTEGER NOT NULL,
    total_infractions INTEGER DEFAULT 1
);
  `,
).run();

module.exports = db;
