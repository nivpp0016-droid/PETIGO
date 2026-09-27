const express = require("express");

const db = require("../database/database");
const authenticateDevice = require("../middleware/deviceAuth");

const router = express.Router();

// ESP32 sends its current status
router.post("/status", authenticateDevice, (req, res) => {
  try {
    const {
      doorStatus,
      lockStatus,
      parcelStatus,
      distanceCm,
      wifiRssi
    } = req.body;

    const allowedDoorStatus = ["open", "closed"];
    const allowedLockStatus = ["locked", "unlocked"];
    const allowedParcelStatus = ["empty", "detected"];

    if (!allowedDoorStatus.includes(doorStatus)) {
      return res.status(400).json({
        error: "Invalid door status"
      });
    }

    if (!allowedLockStatus.includes(lockStatus)) {
      return res.status(400).json({
        error: "Invalid lock status"
      });
    }

    if (!allowedParcelStatus.includes(parcelStatus)) {
      return res.status(400).json({
        error: "Invalid parcel status"
      });
    }

    // Check if a parcel was just delivered (door closed with parcel present)
    const currentBox = db
      .prepare("SELECT door_status, parcel_status FROM boxes WHERE id = ?")
      .get(req.device.id);

    if (
      currentBox &&
      doorStatus === "closed" &&
      parcelStatus === "detected" &&
      (currentBox.door_status === "open" || currentBox.parcel_status === "empty")
    ) {
      // Transition any in-progress delivery to COMPLETED, or record new COMPLETED delivery
      const activeDelivery = db
        .prepare(`
          SELECT id FROM deliveries
          WHERE box_id = ? AND status = 'IN_PROGRESS'
          ORDER BY id DESC
          LIMIT 1
        `)
        .get(req.device.id);

      if (activeDelivery) {
        db.prepare("UPDATE deliveries SET status = 'COMPLETED' WHERE id = ?").run(activeDelivery.id);
      } else {
        db.prepare("INSERT INTO deliveries (box_id, status, created_at) VALUES (?, 'COMPLETED', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))").run(req.device.id);
      }

      // Record security log
      db.prepare(`
        INSERT INTO security_logs (box_id, event, details, created_at)
        VALUES (?, 'PARCEL_DELIVERED', 'Parcel deposited inside box and door secured', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      `).run(req.device.id);
    }

    db.prepare(`
      UPDATE boxes
      SET
        status = 'online',
        door_status = ?,
        lock_status = ?,
        parcel_status = ?,
        distance_cm = COALESCE(?, distance_cm),
        wifi_rssi = COALESCE(?, wifi_rssi),
        updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      WHERE id = ?
    `).run(
      doorStatus,
      lockStatus,
      parcelStatus,
      distanceCm !== undefined ? distanceCm : null,
      wifiRssi !== undefined ? wifiRssi : null,
      req.device.id
    );

    res.json({
      message: "Device status updated",
      boxCode: req.device.box_code,
      status: "online"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update device status"
    });
  }
});

// ESP32 checks whether the backend is reachable
router.get("/heartbeat", authenticateDevice, (req, res) => {
  try {
    db.prepare(`
      UPDATE boxes
      SET status = 'online', updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      WHERE id = ?
    `).run(req.device.id);

    res.json({
      status: "ok",
      boxCode: req.device.box_code,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.json({
      status: "ok",
      boxCode: req.device.box_code,
      serverTime: new Date().toISOString()
    });
  }
});

// ESP32 checks for pending commands
router.get("/commands", authenticateDevice, (req, res) => {
  try {
    const command = db
      .prepare(`
        SELECT
          id,
          box_id,
          command,
          status,
          created_at
        FROM device_commands
        WHERE box_id = ?
          AND status = 'pending'
        ORDER BY id ASC
        LIMIT 1
      `)
      .get(req.device.id);

    if (!command) {
      return res.json({
        command: null
      });
    }

    res.json({
      command: command.command,
      commandId: command.id
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to retrieve device command"
    });
  }
});

// ESP32 acknowledges a command after executing it
router.post("/commands/:commandId/ack", authenticateDevice, (req, res) => {
  try {
    const commandId = Number(req.params.commandId);

    if (!Number.isInteger(commandId)) {
      return res.status(400).json({
        error: "Invalid command ID"
      });
    }

    const command = db
      .prepare(`
        SELECT id, box_id, status
        FROM device_commands
        WHERE id = ? AND box_id = ?
      `)
      .get(commandId, req.device.id);

    if (!command) {
      return res.status(404).json({
        error: "Command not found"
      });
    }

    if (command.status !== "pending") {
      return res.status(409).json({
        error: "Command is not pending"
      });
    }

    db.prepare(`
      UPDATE device_commands
      SET
        status = 'executed',
        executed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      WHERE id = ?
    `).run(commandId);

    res.json({
      message: "Command acknowledged",
      commandId,
      status: "executed"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to acknowledge command"
    });
  }
});

module.exports = router;