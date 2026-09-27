const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const db = require("./database/database");
const authRoutes = require("./routes/auth");
const authenticateToken = require("./middleware/auth");
const boxRoutes = require("./routes/boxes");
const deviceRoutes = require("./routes/device");
const otpRoutes = require("./routes/otp");

const app = express();
const PORT = process.env.PORT || 3000;

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/boxes", boxRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/otp", otpRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    project: "Universal Smart Parcel Box",
    server: "running"
  });
});

app.get(
  "/api/protected",
  authenticateToken,
  (req, res) => {
    res.json({
      message: "You are authenticated",
      user: req.user
    });
  }
);

// Start server
if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log("Universal Smart Parcel Box");
    console.log("Backend server started");
    console.log(`Running on http://localhost:${PORT}`);
    console.log("=================================");
  });
}

module.exports = app;