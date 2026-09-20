from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from backend_python.models import DeviceStatusRequest
from backend_python.database import get_db
from backend_python.auth import get_current_device

router = APIRouter(prefix="/api/device", tags=["Device Communication"])

@router.post("/status")
def update_device_status(req: DeviceStatusRequest, device: dict = Depends(get_current_device)):
    allowed_doors = ["open", "closed"]
    allowed_locks = ["locked", "unlocked"]
    allowed_parcels = ["empty", "detected"]

    if req.doorStatus not in allowed_doors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid door status"
        )

    if req.lockStatus not in allowed_locks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid lock status"
        )

    if req.parcelStatus not in allowed_parcels:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid parcel status"
        )

    with get_db() as conn:
        current_box = conn.execute(
            "SELECT door_status, parcel_status FROM boxes WHERE id = ?",
            (device["id"],)
        ).fetchone()

        if (
            current_box
            and req.doorStatus == "closed"
            and req.parcelStatus == "detected"
            and (current_box["door_status"] == "open" or current_box["parcel_status"] == "empty")
        ):
            # Check for active in-progress delivery
            active_delivery = conn.execute("""
                SELECT id FROM deliveries
                WHERE box_id = ? AND status = 'IN_PROGRESS'
                ORDER BY id DESC LIMIT 1
            """, (device["id"],)).fetchone()

            if active_delivery:
                conn.execute("UPDATE deliveries SET status = 'COMPLETED' WHERE id = ?", (active_delivery["id"],))
            else:
                conn.execute("INSERT INTO deliveries (box_id, status) VALUES (?, 'COMPLETED')", (device["id"],))

            conn.execute(
                "INSERT INTO security_logs (box_id, event, details) VALUES (?, 'PARCEL_DELIVERED', 'Parcel deposited inside box and door secured')",
                (device["id"],)
            )

        conn.execute("""
            UPDATE boxes
            SET status = 'online',
                door_status = ?,
                lock_status = ?,
                parcel_status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (req.doorStatus, req.lockStatus, req.parcelStatus, device["id"]))

    return {
        "message": "Device status updated",
        "boxCode": device["box_code"],
        "status": "online"
    }

@router.get("/heartbeat")
def heartbeat(device: dict = Depends(get_current_device)):
    with get_db() as conn:
        conn.execute(
            "UPDATE boxes SET status = 'online', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (device["id"],)
        )

    return {
        "status": "ok",
        "boxCode": device["box_code"],
        "serverTime": datetime.now(timezone.utc).isoformat()
    }

@router.get("/commands")
def get_commands(device: dict = Depends(get_current_device)):
    with get_db() as conn:
        cmd = conn.execute("""
            SELECT id, box_id, command, status, created_at
            FROM device_commands
            WHERE box_id = ? AND status = 'pending'
            ORDER BY id ASC
            LIMIT 1
        """, (device["id"],)).fetchone()

        if not cmd:
            return {"command": None}

        return {
            "command": cmd["command"],
            "commandId": cmd["id"]
        }

@router.post("/commands/{command_id}/ack")
def acknowledge_command(command_id: str, device: dict = Depends(get_current_device)):
    try:
        numeric_id = int(command_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid command ID"
        )

    with get_db() as conn:
        cmd = conn.execute(
            "SELECT id, box_id, status FROM device_commands WHERE id = ? AND box_id = ?",
            (numeric_id, device["id"])
        ).fetchone()

        if not cmd:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Command not found"
            )

        if cmd["status"] != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Command is not pending"
            )

        conn.execute("""
            UPDATE device_commands
            SET status = 'executed',
                executed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (numeric_id,))

    return {
        "message": "Command acknowledged",
        "commandId": numeric_id,
        "status": "executed"
    }
