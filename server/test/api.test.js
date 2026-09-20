const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const http = require("http");

// Configure test environment before loading app
const testDbPath = path.join(__dirname, "test_parcel_box.db");
for (const ext of ["", "-shm", "-wal"]) {
  if (fs.existsSync(testDbPath + ext)) {
    try {
      fs.unlinkSync(testDbPath + ext);
    } catch {}
  }
}

process.env.DB_PATH = testDbPath;
process.env.JWT_SECRET = "test-jwt-secret-key-123456789";

const app = require("../server");
const db = require("../database/database");

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  try {
    db.close();
  } catch {}
  for (const ext of ["", "-shm", "-wal"]) {
    if (fs.existsSync(testDbPath + ext)) {
      try {
        fs.unlinkSync(testDbPath + ext);
      } catch {}
    }
  }
});

describe("Universal Smart Parcel Box API Test Suite", () => {
  let authToken = "";
  let userId = null;
  let boxId = null;
  let deviceToken = "";
  const testEmail = `tester_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  // 1. Health check
  describe("Health Check", () => {
    test("GET /api/health returns running status", async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "ok");
      assert.equal(data.server, "running");
      assert.equal(data.project, "Universal Smart Parcel Box");
    });
  });

  // 2. Authentication
  describe("Authentication", () => {
    test("POST /api/auth/register validates missing fields", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bad@test.com" })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /Name, email and password are required/i);
    });

    test("POST /api/auth/register validates minimum password length", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "shortpass@test.com",
          password: "123"
        })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /at least 6 characters/i);
    });

    test("POST /api/auth/register creates a new user", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: testEmail,
          password: testPassword
        })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.userId);
      userId = data.userId;
    });

    test("POST /api/auth/register prevents duplicate email registration", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate User",
          email: testEmail,
          password: testPassword
        })
      });
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.match(data.error, /User already exists/i);
    });

    test("POST /api/auth/login rejects wrong password", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: "WrongPassword"
        })
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.match(data.error, /Invalid email or password/i);
    });

    test("POST /api/auth/login succeeds with valid credentials", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.email, testEmail);
      assert.equal(data.user.name, "Test User");
      authToken = data.token;
    });

    test("POST /api/auth/login works with mixed-case and whitespace-padded email", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `  ${testEmail.toUpperCase()}  `,
          password: testPassword
        })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(data.token);
      assert.equal(data.user.email, testEmail);
    });
  });

  // 3. Protected routes & Middleware
  describe("Protected Routes", () => {
    test("GET /api/protected fails without token", async () => {
      const res = await fetch(`${baseUrl}/api/protected`);
      assert.equal(res.status, 401);
    });

    test("GET /api/protected fails with invalid token", async () => {
      const res = await fetch(`${baseUrl}/api/protected`, {
        headers: { Authorization: "Bearer bad-token" }
      });
      assert.equal(res.status, 401);
    });

    test("GET /api/protected succeeds with valid token", async () => {
      const res = await fetch(`${baseUrl}/api/protected`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.email, testEmail);
    });
  });

  // 4. Box Management
  describe("Parcel Boxes Management", () => {
    test("POST /api/boxes rejects request without boxCode", async () => {
      const res = await fetch(`${baseUrl}/api/boxes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({})
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /Box code is required/i);
    });

    test("POST /api/boxes registers a new parcel box", async () => {
      const res = await fetch(`${baseUrl}/api/boxes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ boxCode: "TESTBOX-99" })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.ok(data.boxId);
      assert.equal(data.boxCode, "TESTBOX-99");
      boxId = data.boxId;

      // Extract device token from db for testing ESP32 endpoints
      const row = db.prepare("SELECT device_token FROM boxes WHERE id = ?").get(boxId);
      deviceToken = row.device_token;
      assert.ok(deviceToken);
    });

    test("POST /api/boxes rejects duplicate boxCode", async () => {
      const res = await fetch(`${baseUrl}/api/boxes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ boxCode: "TESTBOX-99" })
      });
      assert.equal(res.status, 409);
      const data = await res.json();
      assert.match(data.error, /Box already exists/i);
    });

    test("GET /api/boxes returns the user's boxes", async () => {
      const res = await fetch(`${baseUrl}/api/boxes`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.boxes));
      assert.equal(data.boxes.length, 1);
      assert.equal(data.boxes[0].box_code, "TESTBOX-99");
    });

    test("GET /api/boxes/:id returns single box details", async () => {
      const res = await fetch(`${baseUrl}/api/boxes/${boxId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.box.box_code, "TESTBOX-99");
      assert.equal(data.box.id, boxId);
    });

    test("GET /api/boxes/:id returns 404 for nonexistent box", async () => {
      const res = await fetch(`${baseUrl}/api/boxes/99999`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.equal(res.status, 404);
    });

    test("POST /api/boxes/:id/unlock queues unlock command and logs remote unlock event", async () => {
      const res = await fetch(`${baseUrl}/api/boxes/${boxId}/unlock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.command, "UNLOCK");
      assert.equal(data.boxId, boxId);

      // Verify device_commands
      const cmd = db
        .prepare("SELECT * FROM device_commands WHERE box_id = ? AND status = 'pending' AND command = 'UNLOCK'")
        .get(boxId);
      assert.ok(cmd);

      // Verify security_logs
      const log = db
        .prepare("SELECT * FROM security_logs WHERE box_id = ? AND event = 'REMOTE_UNLOCK'")
        .get(boxId);
      assert.ok(log);
    });

    test("POST /api/boxes/:id/unlock rejects non-integer id", async () => {
      const res = await fetch(`${baseUrl}/api/boxes/notanumber/unlock`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.equal(res.status, 400);
    });
  });

  // 5. OTP Generation and Verification
  describe("OTP Access Flow", () => {
    let generatedOTP = "";

    test("POST /api/otp/generate requires boxId", async () => {
      const res = await fetch(`${baseUrl}/api/otp/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({})
      });
      assert.equal(res.status, 400);
    });

    test("POST /api/otp/generate returns 6-digit OTP", async () => {
      const res = await fetch(`${baseUrl}/api/otp/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ boxId })
      });
      assert.equal(res.status, 201);
      const data = await res.json();
      assert.match(data.otp, /^\d{6}$/);
      assert.equal(data.boxCode, "TESTBOX-99");
      assert.ok(data.expiresAt);
      generatedOTP = data.otp;
    });

    test("POST /api/otp/verify rejects invalid formatted OTP", async () => {
      const res = await fetch(`${baseUrl}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId, otp: "abc" })
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /exactly 6 digits/i);
    });

    test("POST /api/otp/verify rejects incorrect OTP and decreases attempts", async () => {
      const res = await fetch(`${baseUrl}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId, otp: "000000" })
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.equal(data.error, "Invalid OTP");
      assert.equal(data.attemptsRemaining, 4);

      // Verify security log for invalid OTP
      const invalidLog = db
        .prepare("SELECT * FROM security_logs WHERE box_id = ? AND event = 'INVALID_OTP'")
        .get(boxId);
      assert.ok(invalidLog);
    });

    test("POST /api/otp/verify succeeds with correct OTP, queues UNLOCK command and logs security event", async () => {
      const res = await fetch(`${baseUrl}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId, otp: generatedOTP })
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.accessGranted, true);
      assert.equal(data.command, "UNLOCK");

      // Verify command is in device_commands table
      const cmd = db
        .prepare("SELECT * FROM device_commands WHERE box_id = ? AND status = 'pending'")
        .get(boxId);
      assert.ok(cmd);
      assert.equal(cmd.command, "UNLOCK");

      // Verify security log
      const log = db
        .prepare("SELECT * FROM security_logs WHERE box_id = ? AND event = 'OTP_VERIFIED'")
        .get(boxId);
      assert.ok(log);

      // Verify initial delivery record creation in progress
      const delivery = db
        .prepare("SELECT * FROM deliveries WHERE box_id = ? AND status = 'IN_PROGRESS'")
        .get(boxId);
      assert.ok(delivery);
    });

    test("POST /api/otp/verify enforces single-use (cannot reuse verified OTP)", async () => {
      const res = await fetch(`${baseUrl}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boxId, otp: generatedOTP })
      });
      assert.equal(res.status, 401);
      const data = await res.json();
      assert.match(data.error, /No active OTP/i);
    });
  });

  // 6. Device (ESP32) APIs
  describe("Device (ESP32) Communication", () => {
    let pendingCommandId = null;

    test("GET /api/device/heartbeat requires device authentication", async () => {
      const res = await fetch(`${baseUrl}/api/device/heartbeat`);
      assert.equal(res.status, 401);
    });

    test("GET /api/device/heartbeat succeeds with x-device-token", async () => {
      const res = await fetch(`${baseUrl}/api/device/heartbeat`, {
        headers: { "x-device-token": deviceToken }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "ok");
      assert.equal(data.boxCode, "TESTBOX-99");
      assert.ok(data.serverTime);
    });

    test("POST /api/device/status validates statuses and updates telemetry", async () => {
      // Invalid status test
      const badRes = await fetch(`${baseUrl}/api/device/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-token": deviceToken
        },
        body: JSON.stringify({
          doorStatus: "invalid",
          lockStatus: "locked",
          parcelStatus: "empty"
        })
      });
      assert.equal(badRes.status, 400);

      // Valid status update - door opened and parcel empty
      const res = await fetch(`${baseUrl}/api/device/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-token": deviceToken
        },
        body: JSON.stringify({
          doorStatus: "open",
          lockStatus: "unlocked",
          parcelStatus: "empty"
        })
      });
      assert.equal(res.status, 200);

      // Verify db update
      const box = db.prepare("SELECT * FROM boxes WHERE id = ?").get(boxId);
      assert.equal(box.status, "online");
      assert.equal(box.door_status, "open");
      assert.equal(box.lock_status, "unlocked");
      assert.equal(box.parcel_status, "empty");
      assert.ok(box.updated_at);

      // Parcel deposited and door closed -> auto-completes delivery
      const closeRes = await fetch(`${baseUrl}/api/device/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-token": deviceToken
        },
        body: JSON.stringify({
          doorStatus: "closed",
          lockStatus: "locked",
          parcelStatus: "detected"
        })
      });
      assert.equal(closeRes.status, 200);

      // Verify completed delivery record
      const completedDelivery = db
        .prepare("SELECT * FROM deliveries WHERE box_id = ? AND status = 'COMPLETED'")
        .get(boxId);
      assert.ok(completedDelivery);

      // Verify PARCEL_DELIVERED security log
      const deliveredLog = db
        .prepare("SELECT * FROM security_logs WHERE box_id = ? AND event = 'PARCEL_DELIVERED'")
        .get(boxId);
      assert.ok(deliveredLog);
    });

    test("GET /api/device/commands retrieves pending UNLOCK command", async () => {
      const res = await fetch(`${baseUrl}/api/device/commands`, {
        headers: { "x-device-token": deviceToken }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.command, "UNLOCK");
      assert.ok(data.commandId);
      pendingCommandId = data.commandId;
    });

    test("POST /api/device/commands/:id/ack acknowledges execution", async () => {
      const res = await fetch(
        `${baseUrl}/api/device/commands/${pendingCommandId}/ack`,
        {
          method: "POST",
          headers: { "x-device-token": deviceToken }
        }
      );
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "executed");

      // Verify command is marked executed
      const cmd = db
        .prepare("SELECT * FROM device_commands WHERE id = ?")
        .get(pendingCommandId);
      assert.equal(cmd.status, "executed");
      assert.ok(cmd.executed_at);

      // Drain any additional queued commands from earlier tests
      while (true) {
        const nextRes = await fetch(`${baseUrl}/api/device/commands`, {
          headers: { "x-device-token": deviceToken }
        });
        const nextData = await nextRes.json();
        if (!nextData.command) break;
        await fetch(`${baseUrl}/api/device/commands/${nextData.commandId}/ack`, {
          method: "POST",
          headers: { "x-device-token": deviceToken }
        });
      }
    });

    test("GET /api/device/commands returns null when no commands pending", async () => {
      const res = await fetch(`${baseUrl}/api/device/commands`, {
        headers: { "x-device-token": deviceToken }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.command, null);
    });
  });

  // 7. Activity & Deliveries
  describe("Activity and Delivery History", () => {
    test("GET /api/boxes/activity returns security and delivery log items", async () => {
      const res = await fetch(`${baseUrl}/api/boxes/activity`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.activities));
      assert.ok(data.activities.length > 0);
      const otpEvent = data.activities.find((a) => a.title === "OTP_VERIFIED");
      assert.ok(otpEvent);

      const unlockEvent = data.activities.find((a) => a.title === "REMOTE_UNLOCK");
      assert.ok(unlockEvent);

      const deliveredEvent = data.activities.find((a) => a.title === "PARCEL_DELIVERED");
      assert.ok(deliveredEvent);
    });

    test("GET /api/boxes/deliveries returns deliveries array with COMPLETED delivery", async () => {
      const res = await fetch(`${baseUrl}/api/boxes/deliveries`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data.deliveries));
      assert.ok(data.deliveries.length > 0);
      const completed = data.deliveries.find((d) => d.status === "COMPLETED");
      assert.ok(completed);
    });
  });
});
