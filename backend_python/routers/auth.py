from fastapi import APIRouter, HTTPException, status
from backend_python.models import RegisterRequest, LoginRequest
from backend_python.database import get_db
from backend_python.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    name = (req.name or "").strip()
    email = (req.email or "").strip().lower()
    password = req.password or ""

    if not name or not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name, email and password are required"
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least 6 characters"
        )

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists"
            )

        hashed = hash_password(password)
        cursor = conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email, hashed)
        )
        user_id = cursor.lastrowid

    return {
        "message": "User registered successfully",
        "userId": user_id
    }

@router.post("/login")
def login(req: LoginRequest):
    email = (req.email or "").strip().lower()
    password = req.password or ""

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )

    with get_db() as conn:
        user = conn.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = ?",
            (email,)
        ).fetchone()

        if not user or not verify_password(password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        token = create_access_token(user["id"], user["email"])

        return {
            "message": "Login successful",
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }
