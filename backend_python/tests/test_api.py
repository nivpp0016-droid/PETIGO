import os
import time
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Setup isolated test database before importing app
TEST_DB_PATH = Path(__file__).resolve().parent / "test_parcel_box.db"
for suffix in ["", "-shm", "-wal"]:
    p = Path(str(TEST_DB_PATH) + suffix)
    if p.exists():
        try:
            p.unlink()
        except Exception:
            pass

os.environ["DB_PATH"] = str(TEST_DB_PATH)
os.environ["JWT_SECRET"] = "test-jwt-secret-key-123456789-32bytes-long"

from backend_python.main import app
from backend_python.database import init_db, get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db(str(TEST_DB_PATH))
    yield
    for suffix in ["", "-shm", "-wal"]:
        p = Path(str(TEST_DB_PATH) + suffix)
        if p.exists():
            try:
                p.unlink()
            except Exception:
                pass

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

class TestState:
    auth_token = ""
    user_id = None
    box_id = None
    device_token = ""
    test_email = f"tester_{int(time.time() * 1000)}@example.com"
    test_password = "Password123!"
    generated_otp = ""
    pending_command_id = None

state = TestState()

# 1. Health check
def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["server"] == "running"
    assert data["project"] == "Universal Smart Parcel Box"

# 2. Authentication
def test_register_missing_fields(client):
    res = client.post("/api/auth/register", json={"email": "bad@test.com"})
    assert res.status_code == 400
    assert "required" in res.json().get("error", "").lower()

def test_register_minimum_password_length(client):
    res = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "shortpass@test.com",
        "password": "123"
    })
    assert res.status_code == 400
    assert "at least 6 characters" in res.json().get("error", "").lower()

def test_register_creates_user(client):
    res = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": state.test_email,
        "password": state.test_password
    })
    assert res.status_code == 201
    data = res.json()
    assert "userId" in data
    state.user_id = data["userId"]

def test_register_prevents_duplicate_email(client):
    res = client.post("/api/auth/register", json={
        "name": "Duplicate User",
        "email": state.test_email,
        "password": state.test_password
    })
    assert res.status_code == 409
    assert "already exists" in res.json().get("error", "").lower()

def test_login_rejects_wrong_password(client):
    res = client.post("/api/auth/login", json={
        "email": state.test_email,
        "password": "WrongPassword"
    })
    assert res.status_code == 401
    assert "invalid email or password" in res.json().get("error", "").lower()

def test_login_succeeds_with_valid_credentials(client):
    res = client.post("/api/auth/login", json={
        "email": state.test_email,
        "password": state.test_password
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == state.test_email
    assert data["user"]["name"] == "Test User"
    state.auth_token = data["token"]

def test_login_works_with_mixed_case_and_whitespace(client):
    res = client.post("/api/auth/login", json={
        "email": f"  {state.test_email.upper()}  ",
        "password": state.test_password
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["email"] == state.test_email

# 3. Protected routes
def test_protected_route_fails_without_token(client):
    res = client.get("/api/protected")
    assert res.status_code == 401

def test_protected_route_fails_with_invalid_token(client):
    res = client.get("/api/protected", headers={"Authorization": "Bearer bad-token"})
    assert res.status_code == 401

def test_protected_route_succeeds_with_valid_token(client):
    res = client.get("/api/protected", headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == state.test_email

# 4. Box Management
def test_create_box_rejects_empty_code(client):
    res = client.post("/api/boxes", json={}, headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 400
    assert "required" in res.json().get("error", "").lower()

def test_create_box_registers_new_box(client):
    res = client.post("/api/boxes", json={"boxCode": "TESTBOX-99"}, headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 201
    data = res.json()
    assert data["boxCode"] == "TESTBOX-99"
    state.box_id = data["boxId"]

    # Extract device token from db
    with get_db() as conn:
        row = conn.execute("SELECT device_token FROM boxes WHERE id = ?", (state.box_id,)).fetchone()
        state.device_token = row["device_token"]
        assert state.device_token

def test_create_box_rejects_duplicate_code(client):
    res = client.post("/api/boxes", json={"boxCode": "TESTBOX-99"}, headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 409
    assert "already exists" in res.json().get("error", "").lower()

def test_get_boxes_returns_user_boxes(client):
    res = client.get("/api/boxes", headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["boxes"]) == 1
    assert data["boxes"][0]["box_code"] == "TESTBOX-99"

def test_get_single_box_returns_details(client):
    res = client.get(f"/api/boxes/{state.box_id}", headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["box"]["box_code"] == "TESTBOX-99"

def test_get_single_box_returns_404_for_nonexistent(client):
    res = client.get("/api/boxes/99999", headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 404

def test_remote_unlock_queues_command_and_logs_event(client):
    res = client.post(f"/api/boxes/{state.box_id}/unlock", headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["command"] == "UNLOCK"

    with get_db() as conn:
        cmd = conn.execute("SELECT * FROM device_commands WHERE box_id = ? AND status = 'pending'", (state.box_id,)).fetchone()
        assert cmd is not None
        assert cmd["command"] == "UNLOCK"

        log = conn.execute("SELECT * FROM security_logs WHERE box_id = ? AND event = 'REMOTE_UNLOCK'", (state.box_id,)).fetchone()
        assert log is not None

def test_remote_unlock_rejects_non_integer_id(client):
    res = client.post("/api/boxes/notanumber/unlock", headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 400

# 5. OTP Access Flow
def test_generate_otp_requires_box_id(client):
    res = client.post("/api/otp/generate", json={}, headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 400

def test_generate_otp_returns_6_digit_otp(client):
    res = client.post("/api/otp/generate", json={"boxId": state.box_id}, headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 201
    data = res.json()
    assert len(data["otp"]) == 6
    assert data["otp"].isdigit()
    assert data["boxCode"] == "TESTBOX-99"
    assert "expiresAt" in data
    state.generated_otp = data["otp"]

def test_verify_otp_rejects_invalid_format(client):
    res = client.post("/api/otp/verify", json={"boxId": state.box_id, "otp": "abc"})
    assert res.status_code == 400
    assert "exactly 6 digits" in res.json().get("error", "").lower()

def test_verify_otp_rejects_incorrect_and_decreases_attempts(client):
    res = client.post("/api/otp/verify", json={"boxId": state.box_id, "otp": "000000"})
    assert res.status_code == 401
    data = res.json()
    assert data.get("error") == "Invalid OTP"
    assert data.get("attemptsRemaining") == 4

    with get_db() as conn:
        log = conn.execute("SELECT * FROM security_logs WHERE box_id = ? AND event = 'INVALID_OTP'", (state.box_id,)).fetchone()
        assert log is not None

def test_verify_otp_succeeds_with_correct_otp(client):
    res = client.post("/api/otp/verify", json={"boxId": state.box_id, "otp": state.generated_otp})
    assert res.status_code == 200
    data = res.json()
    assert data["accessGranted"] is True
    assert data["command"] == "UNLOCK"

    with get_db() as conn:
        log = conn.execute("SELECT * FROM security_logs WHERE box_id = ? AND event = 'OTP_VERIFIED'", (state.box_id,)).fetchone()
        assert log is not None

        delivery = conn.execute("SELECT * FROM deliveries WHERE box_id = ? AND status = 'IN_PROGRESS'", (state.box_id,)).fetchone()
        assert delivery is not None

def test_verify_otp_enforces_single_use(client):
    res = client.post("/api/otp/verify", json={"boxId": state.box_id, "otp": state.generated_otp})
    assert res.status_code == 401
    assert "no active otp" in res.json().get("error", "").lower()

# 6. Device (ESP32) Communication
def test_device_heartbeat_requires_token(client):
    res = client.get("/api/device/heartbeat")
    assert res.status_code == 401

def test_device_heartbeat_succeeds_with_token(client):
    res = client.get("/api/device/heartbeat", headers={"x-device-token": state.device_token})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["boxCode"] == "TESTBOX-99"

def test_device_status_updates_telemetry_and_completes_delivery(client):
    # Invalid status
    bad_res = client.post("/api/device/status", headers={"x-device-token": state.device_token}, json={
        "doorStatus": "invalid",
        "lockStatus": "locked",
        "parcelStatus": "empty"
    })
    assert bad_res.status_code == 400

    # Door open, parcel empty
    res = client.post("/api/device/status", headers={"x-device-token": state.device_token}, json={
        "doorStatus": "open",
        "lockStatus": "unlocked",
        "parcelStatus": "empty"
    })
    assert res.status_code == 200

    with get_db() as conn:
        box = conn.execute("SELECT * FROM boxes WHERE id = ?", (state.box_id,)).fetchone()
        assert box["door_status"] == "open"
        assert box["lock_status"] == "unlocked"
        assert box["parcel_status"] == "empty"

    # Door closed with parcel detected -> auto completes delivery
    close_res = client.post("/api/device/status", headers={"x-device-token": state.device_token}, json={
        "doorStatus": "closed",
        "lockStatus": "locked",
        "parcelStatus": "detected"
    })
    assert close_res.status_code == 200

    with get_db() as conn:
        completed = conn.execute("SELECT * FROM deliveries WHERE box_id = ? AND status = 'COMPLETED'", (state.box_id,)).fetchone()
        assert completed is not None

        delivered_log = conn.execute("SELECT * FROM security_logs WHERE box_id = ? AND event = 'PARCEL_DELIVERED'", (state.box_id,)).fetchone()
        assert delivered_log is not None

def test_device_commands_retrieves_pending_command(client):
    res = client.get("/api/device/commands", headers={"x-device-token": state.device_token})
    assert res.status_code == 200
    data = res.json()
    assert data["command"] == "UNLOCK"
    assert data["commandId"] is not None
    state.pending_command_id = data["commandId"]

def test_device_commands_ack_acknowledges_execution(client):
    res = client.post(f"/api/device/commands/{state.pending_command_id}/ack", headers={"x-device-token": state.device_token})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "executed"

    with get_db() as conn:
        cmd = conn.execute("SELECT * FROM device_commands WHERE id = ?", (state.pending_command_id,)).fetchone()
        assert cmd["status"] == "executed"
        assert cmd["executed_at"] is not None

    # Drain any remaining queued commands
    while True:
        next_res = client.get("/api/device/commands", headers={"x-device-token": state.device_token})
        next_data = next_res.json()
        if not next_data.get("command"):
            break
        client.post(f"/api/device/commands/{next_data['commandId']}/ack", headers={"x-device-token": state.device_token})

def test_device_commands_returns_null_when_empty(client):
    res = client.get("/api/device/commands", headers={"x-device-token": state.device_token})
    assert res.status_code == 200
    data = res.json()
    assert data["command"] is None

# 7. Activity & Deliveries
def test_get_activity_returns_items(client):
    res = client.get("/api/boxes/activity", headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["activities"]) > 0

    titles = [a["title"] for a in data["activities"]]
    assert "OTP_VERIFIED" in titles
    assert "REMOTE_UNLOCK" in titles
    assert "PARCEL_DELIVERED" in titles

def test_get_deliveries_returns_completed_delivery(client):
    res = client.get("/api/boxes/deliveries", headers={"Authorization": f"Bearer {state.auth_token}"})
    assert res.status_code == 200
    data = res.json()
    assert len(data["deliveries"]) > 0
    completed = [d for d in data["deliveries"] if d["status"] == "COMPLETED"]
    assert len(completed) > 0
