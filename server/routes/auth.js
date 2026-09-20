const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("../database/database");

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "development-secret-change-later";

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required"
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must contain at least 6 characters"
      });
    }

    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(cleanEmail);

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = db
      .prepare(`
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
      `)
      .run(cleanName, cleanEmail, passwordHash);

    res.status(201).json({
      message: "User registered successfully",
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Registration failed"
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    const user = db
      .prepare(`
        SELECT id, name, email, password_hash
        FROM users
        WHERE email = ?
      `)
      .get(cleanEmail);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Login failed"
    });
  }
});

module.exports = router;