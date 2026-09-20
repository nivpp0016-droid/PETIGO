import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from backend_python.models import CreateBoxRequest
from backend_python.database import get_db
from backend_python.auth import get_current_user

router = APIRouter(prefix="/api/boxes", tags=["Boxes"])

@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_box(req: CreateBoxRequest, user: dict = Depends(get_current_user)):
    box_code = (req.boxCode or "").strip()
    if not box_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Box code is required"
        )

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM boxes WHERE box_code = ?", (box_code,)).fetchone()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Box already exists"
            )

        device_token = secrets.token_hex(32)
        cursor = conn.execute(
            "INSERT INTO boxes (box_code, owner_id, device_token) VALUES (?, ?, ?)",
            (box_code, user["userId"], device_token)
        )
        box_id = cursor.lastrowid

    return {
        "message": "Parcel box created successfully",
        "boxId": box_id,
        "boxCode": box_code
    }

@router.get("")
@router.get("/")
def get_user_boxes(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                id,
                box_code,
                status,
                door_status,
                lock_status,
                parcel_status,
                created_at,
                updated_at
            FROM boxes
            WHERE owner_id = ?
        """, (user["userId"],)).fetchall()

    return {"boxes": [dict(r) for r in rows]}

@router.get("/activity")
def get_activity(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                id,
                box_id,
                'security' AS type,
                event AS title,
                details AS description,
                created_at
            FROM security_logs
            WHERE box_id IN (
                SELECT id FROM boxes WHERE owner_id = ?
            )

            UNION ALL

            SELECT
                id,
                box_id,
                'delivery' AS type,
                'Delivery ' || status AS title,
                'Parcel box delivery activity' AS description,
                created_at
            FROM deliveries
            WHERE box_id IN (
                SELECT id FROM boxes WHERE owner_id = ?
            )

            ORDER BY created_at DESC
            LIMIT 20
        """, (user["userId"], user["userId"])).fetchall()

    return {"activities": [dict(r) for r in rows]}

@router.get("/deliveries")
def get_deliveries(user: dict = Depends(get_current_user)):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                deliveries.id,
                deliveries.box_id,
                boxes.box_code,
                deliveries.status,
                deliveries.created_at
            FROM deliveries
            INNER JOIN boxes ON deliveries.box_id = boxes.id
            WHERE boxes.owner_id = ?
            ORDER BY deliveries.created_at DESC
            LIMIT 50
        """, (user["userId"],)).fetchall()

    return {"deliveries": [dict(r) for r in rows]}

@router.get("/{box_id}")
def get_box(box_id: str, user: dict = Depends(get_current_user)):
    try:
        numeric_id = int(box_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid box ID"
        )

    with get_db() as conn:
        row = conn.execute("""
            SELECT
                id,
                box_code,
                status,
                door_status,
                lock_status,
                parcel_status,
                created_at,
                updated_at
            FROM boxes
            WHERE id = ? AND owner_id = ?
        """, (numeric_id, user["userId"])).fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parcel box not found"
            )

        return {"box": dict(row)}

@router.post("/{box_id}/unlock")
def unlock_box(box_id: str, user: dict = Depends(get_current_user)):
    try:
        numeric_id = int(box_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid box ID"
        )

    with get_db() as conn:
        box = conn.execute(
            "SELECT id, box_code FROM boxes WHERE id = ? AND owner_id = ?",
            (numeric_id, user["userId"])
        ).fetchone()

        if not box:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parcel box not found"
            )

        # Queue unlock command
        conn.execute(
            "INSERT INTO device_commands (box_id, command, status) VALUES (?, 'UNLOCK', 'pending')",
            (box["id"],)
        )

        # Record in security logs
        conn.execute(
            "INSERT INTO security_logs (box_id, event, details) VALUES (?, 'REMOTE_UNLOCK', 'Owner triggered remote unlock from dashboard')",
            (box["id"],)
        )

    return {
        "message": "Unlock command queued successfully",
        "boxId": box["id"],
        "command": "UNLOCK"
    }
