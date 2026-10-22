const path = require("path");
const db = require("../server/database/database");
const bcrypt = require("../server/node_modules/bcrypt");

async function seed() {
  console.log("Seeding demo user and parcel box...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  // Check if demo user exists
  let user = db.prepare("SELECT * FROM users WHERE email = 'demo@petigo.com'").get();
  if (!user) {
    // Check if user 1 exists, update it to demo@petigo.com
    const user1 = db.prepare("SELECT * FROM users WHERE id = 1").get();
    if (user1) {
      db.prepare("UPDATE users SET name = 'Demo User', email = 'demo@petigo.com', password_hash = ? WHERE id = 1").run(passwordHash);
      user = db.prepare("SELECT * FROM users WHERE id = 1").get();
    } else {
      const res = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run("Demo User", "demo@petigo.com", passwordHash);
      user = { id: res.lastInsertRowid, email: "demo@petigo.com", name: "Demo User" };
    }
  } else {
    db.prepare("UPDATE users SET name = 'Demo User', password_hash = ? WHERE id = ?").run(passwordHash, user.id);
  }

  // Remove any redundant demo users if id != user.id
  db.prepare("DELETE FROM users WHERE email = 'demo@petigo.com' AND id != ?").run(user.id);
  console.log(`Demo user active: ${user.email} (ID: ${user.id})`);

  // Ensure box belongs to this user and has box_code = 'PETIGO Box 01'
  let box = db.prepare("SELECT * FROM boxes WHERE owner_id = ?").get(user.id);
  if (!box) {
    box = db.prepare("SELECT * FROM boxes LIMIT 1").get();
    if (box) {
      db.prepare("UPDATE boxes SET owner_id = ?, box_code = 'PETIGO Box 01' WHERE id = ?").run(user.id, box.id);
      box = db.prepare("SELECT * FROM boxes WHERE id = ?").get(box.id);
    }
  }

  const deviceToken = box ? box.device_token : "0002dd345005e1bcc1a016bdb9855d55b7d6a0522f6a49c99013145aca8b5228";

  db.prepare(`
    UPDATE boxes SET
      box_code = 'PETIGO Box 01',
      status = 'online',
      door_status = 'closed',
      lock_status = 'locked',
      parcel_status = 'empty',
      distance_cm = 45.2,
      wifi_rssi = -58,
      camera_url = 'http://192.168.31.144:81/stream',
      updated_at = datetime('now')
    WHERE id = ?
  `).run(box.id);
  console.log(`Updated box ID ${box.id}: 'PETIGO Box 01'`);

  // Ensure at least 2 completed deliveries
  const deliveryCount = db.prepare("SELECT count(*) as count FROM deliveries WHERE box_id = ?").get(box.id).count;
  if (deliveryCount < 2) {
    db.prepare(`
      INSERT INTO deliveries (box_id, status, created_at)
      VALUES (?, 'COMPLETED', datetime('now', '-2 days'))
    `).run(box.id);
    db.prepare(`
      INSERT INTO deliveries (box_id, status, created_at)
      VALUES (?, 'COMPLETED', datetime('now', '-4 hours'))
    `).run(box.id);
    console.log("Inserted sample completed deliveries.");
  }

  // Ensure realistic security logs
  const logEvents = [
    { event: "OTP_VERIFIED", details: "Delivery OTP verified successfully for courier drop-off", time: "-3 hours" },
    { event: "PARCEL_DELIVERED", details: "Parcel deposited inside chamber and door securely closed", time: "-3 hours" },
    { event: "REMOTE_UNLOCK", details: "Owner triggered remote unlock from dashboard", time: "-1 day" },
    { event: "INVALID_OTP", details: "Incorrect OTP attempt (1/5) rejected by door lock", time: "-2 days" },
    { event: "MAX_OTP_ATTEMPTS_EXCEEDED", details: "Access blocked: Maximum 5 OTP attempts exceeded", time: "-2 days" }
  ];

  for (const log of logEvents) {
    const existing = db.prepare("SELECT id FROM security_logs WHERE box_id = ? AND event = ?").get(box.id, log.event);
    if (!existing) {
      db.prepare(`
        INSERT INTO security_logs (box_id, event, details, created_at)
        VALUES (?, ?, ?, datetime('now', ?))
      `).run(box.id, log.event, log.details, log.time);
    }
  }
  console.log("Security audit logs seeded successfully.");
}

seed().catch(console.error);
