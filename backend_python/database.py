import sqlite3
from contextlib import contextmanager
from backend_python.config import DB_PATH

def get_db_connection(db_path: str = None) -> sqlite3.Connection:
    target_path = db_path or DB_PATH
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

@contextmanager
def get_db(db_path: str = None):
    conn = get_db_connection(db_path)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db(db_path: str = None):
    target_path = db_path or DB_PATH
    with get_db(target_path) as conn:
        conn.executescript("""
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
        """)

        # Safe migration for updated_at column
        cursor = conn.execute("PRAGMA table_info(boxes)")
        cols = [row["name"] for row in cursor.fetchall()]
        if "updated_at" not in cols:
            conn.execute("ALTER TABLE boxes ADD COLUMN updated_at TEXT")
            conn.execute("UPDATE boxes SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL")
