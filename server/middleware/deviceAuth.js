const db = require("../database/database");

function authenticateDevice(req, res, next) {
  const deviceToken = req.headers["x-device-token"];

  if (!deviceToken) {
    return res.status(401).json({
      error: "Device authentication required"
    });
  }

  const box = db
    .prepare(`
      SELECT id, box_code, owner_id
      FROM boxes
      WHERE device_token = ?
    `)
    .get(deviceToken);

  if (!box) {
    return res.status(401).json({
      error: "Invalid device token"
    });
  }

  req.device = box;

  next();
}

module.exports = authenticateDevice;