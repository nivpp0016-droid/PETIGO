import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from backend_python.models import GenerateOtpRequest, VerifyOtpRequest
from backend_python.database import get_db
from backend_python.auth import get_current_user

router = APIRouter(prefix="/api/otp", tags=["OTP Access"])

@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_otp(req: GenerateOtpRequest, user: dict = Depends(get_current_user)):
    if not req.boxId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Box ID is required"
        )

    with get_db() as conn:
        box = conn.execute(
            "SELECT id, box_code FROM boxes WHERE id = ? AND owner_id = ?",
            (req.boxId, user["userId"])
        ).fetchone()

        if not box:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parcel box not found"
            )

        otp = str(secrets.randbelow(900000) + 100000)
        otp_hash = hashlib.sha256(otp.encode("utf-8")).hexdigest()
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()

        # Invalidate any active OTP sessions for this box
        conn.execute(
            "UPDATE otp_sessions SET used = 1 WHERE box_id = ? AND used = 0",
            (box["id"],)
        )

        conn.execute(
            "INSERT INTO otp_sessions (box_id, otp_hash, expires_at) VALUES (?, ?, ?)",
            (box["id"], otp_hash, expires_at)
        )

    return {
        "message": "OTP generated successfully",
        "boxCode": box["box_code"],
        "otp": otp,
        "expiresAt": expires_at
    }

@router.post("/verify")
def verify_otp(
    req: VerifyOtpRequest,
    x_device_token: Optional[str] = Header(None, alias="x-device-token")
):
    box_id = req.boxId
    otp = (req.otp or "").strip()

    with get_db() as conn:
        if not box_id and req.boxCode:
            box = conn.execute("SELECT id FROM boxes WHERE box_code = ?", (req.boxCode,)).fetchone()
            if box:
                box_id = box["id"]

        if not box_id and x_device_token:
            box = conn.execute("SELECT id FROM boxes WHERE device_token = ?", (x_device_token,)).fetchone()
            if box:
                box_id = box["id"]

        if not box_id or not otp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Box ID and OTP are required"
            )

        if not re.match(r"^\d{6}$", otp):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP must contain exactly 6 digits"
            )

        session = conn.execute("""
            SELECT id, box_id, otp_hash, expires_at, attempts, used
            FROM otp_sessions
            WHERE box_id = ? AND used = 0
            ORDER BY id DESC
            LIMIT 1
        """, (box_id,)).fetchone()

        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No active OTP"
            )

        if session["attempts"] >= 5:
            conn.execute(
                "INSERT INTO security_logs (box_id, event, details) VALUES (?, 'MAX_OTP_ATTEMPTS_EXCEEDED', 'Access blocked: Maximum 5 OTP attempts exceeded')",
                (session["box_id"],)
            )
            conn.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Maximum OTP attempts exceeded"
            )

        # Check expiration
        expires_dt = datetime.fromisoformat(session["expires_at"].replace("Z", "+00:00"))
        now_dt = datetime.now(timezone.utc)
        if expires_dt.tzinfo is None:
            expires_dt = expires_dt.replace(tzinfo=timezone.utc)

        if now_dt > expires_dt:
            conn.execute("UPDATE otp_sessions SET used = 1 WHERE id = ?", (session["id"],))
            conn.execute(
                "INSERT INTO security_logs (box_id, event, details) VALUES (?, 'OTP_EXPIRED', 'Attempted to use an expired delivery OTP')",
                (session["box_id"],)
            )
            conn.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OTP has expired"
            )

        submitted_hash = hashlib.sha256(otp.encode("utf-8")).hexdigest()
        if submitted_hash != session["otp_hash"]:
            next_attempts = session["attempts"] + 1
            conn.execute("UPDATE otp_sessions SET attempts = ? WHERE id = ?", (next_attempts, session["id"]))
            conn.execute(
                "INSERT INTO security_logs (box_id, event, details) VALUES (?, 'INVALID_OTP', ?)",
                (session["box_id"], f"Incorrect OTP attempt ({next_attempts}/5)")
            )
            conn.commit()
            remaining = max(0, 5 - next_attempts)
            # Custom 401 response with attemptsRemaining
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "Invalid OTP", "attemptsRemaining": remaining}
            )

        # Valid OTP - single use
        conn.execute("UPDATE otp_sessions SET used = 1 WHERE id = ?", (session["id"],))

        # Initial delivery in progress
        conn.execute("INSERT INTO deliveries (box_id, status) VALUES (?, 'IN_PROGRESS')", (session["box_id"],))

        # Queue unlock command
        conn.execute(
            "INSERT INTO device_commands (box_id, command, status) VALUES (?, 'UNLOCK', 'pending')",
            (session["box_id"],)
        )

        # Security log
        conn.execute(
            "INSERT INTO security_logs (box_id, event, details) VALUES (?, 'OTP_VERIFIED', 'Delivery OTP verified successfully')",
            (session["box_id"],)
        )

    return {
        "message": "OTP verified successfully",
        "boxId": session["box_id"],
        "accessGranted": True,
        "command": "UNLOCK"
    }
