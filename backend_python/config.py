import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

PORT = int(os.getenv("PORT", "8000"))
JWT_SECRET = os.getenv("JWT_SECRET", "universal-smart-parcel-box-secret-key-32bytes-long")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 7

DEFAULT_DB_PATH = str(BASE_DIR / "parcel_box.db")
DB_PATH = os.getenv("DB_PATH", DEFAULT_DB_PATH)

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*"
]
