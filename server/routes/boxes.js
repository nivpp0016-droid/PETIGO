const express = require("express");
const crypto = require("crypto");

const db = require("../database/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Create a parcel box
router.post("/", authenticateToken, (req, res) => {
  try {
    const { boxCode } = req.body;

    if (!boxCode) {
      return res.status(400).json({
        error: "Box code is required"
      });
    }

    const existingBox = db
      .prepare("SELECT id FROM boxes WHERE box_code = ?")
      .get(boxCode);

    if (existingBox) {
      return res.status(409).json({
        error: "Box already exists"
      });
    }

    const deviceToken = crypto.randomBytes(32).toString("hex");

    const result = db
      .prepare(`
        INSERT INTO boxes (
          box_code,
          owner_id,
          device_token
        )
        VALUES (?, ?, ?)
      `)
      .run(
        boxCode,
        req.user.userId,
        deviceToken
      );

    res.status(201).json({
      message: "Parcel box created successfully",
      boxId: result.lastInsertRowid,
      boxCode
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create parcel box"
    });
  }
});

// Get owner's parcel boxes
router.get("/", authenticateToken, (req, res) => {
  try {
    const boxes = db
      .prepare(`
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
      `)
      .all(req.user.userId);

    res.json({
      boxes
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch parcel boxes"
    });
  }
});

// Get recent activity for the owner's parcel boxes
router.get("/activity", authenticateToken, (req, res) => {
  try {
    const activities = db
      .prepare(`
        SELECT
          id,
          box_id,
          'security' AS type,
          event AS title,
          details AS description,
          created_at
        FROM security_logs
        WHERE box_id IN (
          SELECT id
          FROM boxes
          WHERE owner_id = ?
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
          SELECT id
          FROM boxes
          WHERE owner_id = ?
        )

        ORDER BY created_at DESC
        LIMIT 20
      `)
      .all(
        req.user.userId,
        req.user.userId
      );

    res.json({
      activities
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch activity"
    });
  }
});

// Get delivery history for the owner's parcel boxes
router.get("/deliveries", authenticateToken, (req, res) => {
  try {
    const deliveries = db
      .prepare(`
        SELECT
          deliveries.id,
          deliveries.box_id,
          boxes.box_code,
          deliveries.status,
          deliveries.created_at
        FROM deliveries
        INNER JOIN boxes
          ON deliveries.box_id = boxes.id
        WHERE boxes.owner_id = ?
        ORDER BY deliveries.created_at DESC
        LIMIT 50
      `)
      .all(req.user.userId);

    res.json({
      deliveries
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch delivery history"
    });
  }
});

// Get single parcel box by ID (parameterized route after specific paths)
router.get("/:id", authenticateToken, (req, res) => {
  try {
    const boxId = Number(req.params.id);

    if (!Number.isInteger(boxId)) {
      return res.status(400).json({
        error: "Invalid box ID"
      });
    }

    const box = db
      .prepare(`
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
      `)
      .get(boxId, req.user.userId);

    if (!box) {
      return res.status(404).json({
        error: "Parcel box not found"
      });
    }

    res.json({
      box
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch parcel box"
    });
  }
});

// Remote unlock parcel box by owner
router.post("/:id/unlock", authenticateToken, (req, res) => {
  try {
    const boxId = Number(req.params.id);

    if (!Number.isInteger(boxId)) {
      return res.status(400).json({
        error: "Invalid box ID"
      });
    }

    const box = db
      .prepare("SELECT id, box_code FROM boxes WHERE id = ? AND owner_id = ?")
      .get(boxId, req.user.userId);

    if (!box) {
      return res.status(404).json({
        error: "Parcel box not found"
      });
    }

    // Queue unlock command for the device
    db.prepare(`
      INSERT INTO device_commands (box_id, command, status)
      VALUES (?, 'UNLOCK', 'pending')
    `).run(box.id);

    // Record in security logs
    db.prepare(`
      INSERT INTO security_logs (box_id, event, details)
      VALUES (?, 'REMOTE_UNLOCK', 'Owner triggered remote unlock from dashboard')
    `).run(box.id);

    res.json({
      message: "Unlock command queued successfully",
      boxId: box.id,
      command: "UNLOCK"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to issue remote unlock command"
    });
  }
});

module.exports = router;
