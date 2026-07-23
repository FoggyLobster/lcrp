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

module.exports = db;
