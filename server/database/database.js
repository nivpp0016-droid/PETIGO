const Database = require("better-sqlite3");
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "parcel_box.db");

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS boxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    box_code TEXT UNIQUE NOT NULL,
    owner_id INTEGER NOT NULL,
    device_token TEXT UNIQUE,
    status TEXT DEFAULT 'offline',
    door_status TEXT DEFAULT 'closed',
    lock_status TEXT DEFAULT 'locked',
    parcel_status TEXT DEFAULT 'empty',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS otp_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    box_id INTEGER NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (box_id) REFERENCES boxes(id)
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    box_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (box_id) REFERENCES boxes(id)
  );

  CREATE TABLE IF NOT EXISTS security_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    box_id INTEGER,
    event TEXT NOT NULL,
    details TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (box_id) REFERENCES boxes(id)
  );

  CREATE TABLE IF NOT EXISTS device_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  box_id INTEGER NOT NULL,
  command TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  executed_at TEXT,
  FOREIGN KEY (box_id) REFERENCES boxes(id)
);
`);

// Safe migration for existing database
try {
  const tableInfo = db.prepare("PRAGMA table_info(boxes)").all();
  const hasUpdatedAt = tableInfo.some((col) => col.name === "updated_at");
  if (!hasUpdatedAt) {
    db.exec("ALTER TABLE boxes ADD COLUMN updated_at TEXT");
    db.exec("UPDATE boxes SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
  }

  const hasDistance = tableInfo.some((col) => col.name === "distance_cm");
  if (!hasDistance) {
    db.exec("ALTER TABLE boxes ADD COLUMN distance_cm REAL DEFAULT -1");
  }

  const hasRssi = tableInfo.some((col) => col.name === "wifi_rssi");
  if (!hasRssi) {
    db.exec("ALTER TABLE boxes ADD COLUMN wifi_rssi INTEGER DEFAULT 0");
  }

  const hasCameraUrl = tableInfo.some((col) => col.name === "camera_url");
  if (!hasCameraUrl) {
    db.exec("ALTER TABLE boxes ADD COLUMN camera_url TEXT");
  }

  // Normalize existing timestamps to standard ISO strings with UTC 'Z' indicator
  db.exec(`
    UPDATE boxes
    SET updated_at = replace(updated_at, ' ', 'T') || 'Z'
    WHERE updated_at IS NOT NULL AND updated_at NOT LIKE '%Z';

    UPDATE boxes
    SET created_at = replace(created_at, ' ', 'T') || 'Z'
    WHERE created_at IS NOT NULL AND created_at NOT LIKE '%Z';

    UPDATE deliveries
    SET created_at = replace(created_at, ' ', 'T') || 'Z'
    WHERE created_at IS NOT NULL AND created_at NOT LIKE '%Z';

    UPDATE security_logs
    SET created_at = replace(created_at, ' ', 'T') || 'Z'
    WHERE created_at IS NOT NULL AND created_at NOT LIKE '%Z';
  `);
} catch (err) {
  console.error("Migration error:", err.message);
}

console.log("Database initialized successfully.");

module.exports = db;