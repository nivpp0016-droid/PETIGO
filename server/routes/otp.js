const express = require("express");
const crypto = require("crypto");

const db = require("../database/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Generate a delivery OTP
router.post("/generate", authenticateToken, (req, res) => {
  try {
    const { boxId } = req.body;

    if (!boxId) {
      return res.status(400).json({
        error: "Box ID is required"
      });
    }

    const box = db
      .prepare(`
        SELECT id, box_code
        FROM boxes
        WHERE id = ? AND owner_id = ?
      `)
      .get(boxId, req.user.userId);

    if (!box) {
      return res.status(404).json({
        error: "Parcel box not found"
      });
    }

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    ).toISOString();

    db.prepare(`
      UPDATE otp_sessions
      SET used = 1
      WHERE box_id = ? AND used = 0
    `).run(box.id);

    db.prepare(`
      INSERT INTO otp_sessions (
        box_id,
        otp_hash,
        expires_at
      )
      VALUES (?, ?, ?)
    `).run(
      box.id,
      otpHash,
      expiresAt
    );

    res.status(201).json({
      message: "OTP generated successfully",
      boxCode: box.box_code,
      otp,
      expiresAt
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to generate OTP"
    });
  }
});

// Verify a delivery OTP
router.post("/verify", (req, res) => {
  try {
    let { boxId, otp, boxCode } = req.body;

    if (!boxId && boxCode) {
      const box = db.prepare("SELECT id FROM boxes WHERE box_code = ?").get(boxCode);
      if (box) boxId = box.id;
    }

    if (!boxId && req.headers["x-device-token"]) {
      const box = db.prepare("SELECT id FROM boxes WHERE device_token = ?").get(req.headers["x-device-token"]);
      if (box) boxId = box.id;
    }

    if (!boxId || !otp) {
      return res.status(400).json({
        error: "Box ID and OTP are required"
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        error: "OTP must contain exactly 6 digits"
      });
    }

    const session = db
      .prepare(`
        SELECT
          id,
          box_id,
          otp_hash,
          expires_at,
          attempts,
          used
        FROM otp_sessions
        WHERE box_id = ?
          AND used = 0
        ORDER BY id DESC
        LIMIT 1
      `)
      .get(boxId);

    if (!session) {
      return res.status(401).json({
        error: "No active OTP"
      });
    }

    if (session.attempts >= 5) {
      db.prepare(`
        INSERT INTO security_logs (box_id, event, details)
        VALUES (?, 'MAX_OTP_ATTEMPTS_EXCEEDED', 'Access blocked: Maximum 5 OTP attempts exceeded')
      `).run(session.box_id);

      return res.status(429).json({
        error: "Maximum OTP attempts exceeded"
      });
    }

    if (new Date() > new Date(session.expires_at)) {
      db.prepare(`
        UPDATE otp_sessions
        SET used = 1
        WHERE id = ?
      `).run(session.id);

      db.prepare(`
        INSERT INTO security_logs (box_id, event, details)
        VALUES (?, 'OTP_EXPIRED', 'Attempted to use an expired delivery OTP')
      `).run(session.box_id);

      return res.status(401).json({
        error: "OTP has expired"
      });
    }

    const submittedHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (submittedHash !== session.otp_hash) {
      const nextAttempts = session.attempts + 1;
      db.prepare(`
        UPDATE otp_sessions
        SET attempts = ?
        WHERE id = ?
      `).run(nextAttempts, session.id);

      db.prepare(`
        INSERT INTO security_logs (box_id, event, details)
        VALUES (?, 'INVALID_OTP', ?)
      `).run(
        session.box_id,
        `Incorrect OTP attempt (${nextAttempts}/5)`
      );

      return res.status(401).json({
        error: "Invalid OTP",
        attemptsRemaining: Math.max(0, 5 - nextAttempts)
      });
    }

    // OTP is valid and becomes single-use.
    db.prepare(`
      UPDATE otp_sessions
      SET used = 1
      WHERE id = ?
    `).run(session.id);

    // Record delivery in progress
    db.prepare(`
      INSERT INTO deliveries (box_id, status)
      VALUES (?, 'IN_PROGRESS')
    `).run(session.box_id);

    // Create an unlock command for the physical box.
    db.prepare(`
      INSERT INTO device_commands (
        box_id,
        command,
        status
      )
      VALUES (?, 'UNLOCK', 'pending')
    `).run(session.box_id);

    // Record successful access.
    db.prepare(`
      INSERT INTO security_logs (
        box_id,
        event,
        details
      )
      VALUES (
        ?,
        'OTP_VERIFIED',
        'Delivery OTP verified successfully'
      )
    `).run(session.box_id);

    res.json({
      message: "OTP verified successfully",
      boxId: session.box_id,
      accessGranted: true,
      command: "UNLOCK"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "OTP verification failed"
    });
  }
});

module.exports = router;