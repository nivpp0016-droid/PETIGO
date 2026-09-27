const express = require("express");
const crypto = require("crypto");

const db = require("../database/database");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

function toUTCISO(ts) {
  if (!ts) return null;
  const str = String(ts).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
    return str.replace(" ", "T") + "Z";
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    return str + "Z";
  }
  return str;
}

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
    const rows = db
      .prepare(`
        SELECT
          id,
          box_code,
          status,
          door_status,
          lock_status,
          parcel_status,
          distance_cm,
          wifi_rssi,
          camera_url,
          created_at,
          updated_at
        FROM boxes
        WHERE owner_id = ?
      `)
      .all(req.user.userId);

    const now = Date.now();
    const boxes = rows.map((b) => {
      const isoUpdatedAt = toUTCISO(b.updated_at);
      const isoCreatedAt = toUTCISO(b.created_at);
      const updatedAtMs = isoUpdatedAt ? new Date(isoUpdatedAt).getTime() : 0;
      const isOnline = (now - updatedAtMs) < 25000;
      return {
        ...b,
        created_at: isoCreatedAt,
        updated_at: isoUpdatedAt,
        status: isOnline ? "online" : "offline"
      };
    });

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
      activities: activities.map((a) => ({
        ...a,
        created_at: toUTCISO(a.created_at)
      }))
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch activity"
    });
  }
});

// Clear all security activity logs for owner's boxes
router.delete("/activity", authenticateToken, (req, res) => {
  try {
    db.prepare(`
      DELETE FROM security_logs
      WHERE box_id IN (
        SELECT id FROM boxes WHERE owner_id = ?
      )
    `).run(req.user.userId);

    res.json({
      success: true,
      message: "Security activity logs cleared"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to clear security activity logs"
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
      deliveries: deliveries.map((d) => ({
        ...d,
        created_at: toUTCISO(d.created_at)
      }))
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch delivery history"
    });
  }
});

// Delete a single delivery record
router.delete("/deliveries/:id", authenticateToken, (req, res) => {
  try {
    const deliveryId = Number(req.params.id);

    if (!Number.isInteger(deliveryId)) {
      return res.status(400).json({
        error: "Invalid delivery ID"
      });
    }

    const delivery = db
      .prepare(`
        SELECT deliveries.id
        FROM deliveries
        INNER JOIN boxes
          ON deliveries.box_id = boxes.id
        WHERE deliveries.id = ? AND boxes.owner_id = ?
      `)
      .get(deliveryId, req.user.userId);

    if (!delivery) {
      return res.status(404).json({
        error: "Delivery record not found"
      });
    }

    db.prepare("DELETE FROM deliveries WHERE id = ?").run(deliveryId);

    res.json({
      success: true,
      message: "Delivery deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to delete delivery"
    });
  }
});

// Clear all delivery history for owner's boxes
router.delete("/deliveries", authenticateToken, (req, res) => {
  try {
    db.prepare(`
      DELETE FROM deliveries
      WHERE box_id IN (
        SELECT id FROM boxes WHERE owner_id = ?
      )
    `).run(req.user.userId);

    res.json({
      success: true,
      message: "All delivery history cleared successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to clear delivery history"
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
          distance_cm,
          wifi_rssi,
          camera_url,
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

    const isoUpdatedAt = toUTCISO(box.updated_at);
    const isoCreatedAt = toUTCISO(box.created_at);
    const updatedAtMs = isoUpdatedAt ? new Date(isoUpdatedAt).getTime() : 0;
    const isOnline = (Date.now() - updatedAtMs) < 25000;
    box.status = isOnline ? "online" : "offline";
    box.updated_at = isoUpdatedAt;
    box.created_at = isoCreatedAt;

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

// Update box camera URL
router.put("/:id/camera", authenticateToken, (req, res) => {
  try {
    const boxId = Number(req.params.id);
    const { cameraUrl } = req.body;

    db.prepare(`
      UPDATE boxes
      SET camera_url = ?
      WHERE id = ? AND owner_id = ?
    `).run(cameraUrl || null, boxId, req.user.userId);

    res.json({
      success: true,
      cameraUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to update camera URL"
    });
  }
});

module.exports = router;
