
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default function authRoutes(client) {
  const router = express.Router();

  const getUsers = () =>
    client.db("tour-voz").collection("users");

  // REGISTER
  router.post("/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Name, email and password are required",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const users = getUsers();

      const existingUser = await users.findOne({
        email: normalizedEmail,
      });

      if (existingUser) {
        return res.status(409).json({
          message: "Email already registered",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      await users.insertOne({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
        createdAt: new Date(),
      });

      return res.status(201).json({
        message: "Registration successful",
      });
    } catch (error) {
      console.error("Registration error:", error);

      return res.status(500).json({
        message: "Registration failed",
      });
    }
  });

  // LOGIN
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const user = await getUsers().findOne({
        email: normalizedEmail,
      });

      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        return res.status(500).json({
          message: "JWT_SECRET is missing",
        });
      }

      // Normalize role from MongoDB
      const userRole = String(user.role || "user")
        .trim()
        .toLowerCase();

      const token = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: userRole,
        },
        secret,
        { expiresIn: "1d" }
      );

      return res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: userRole,
        },
      });
    } catch (error) {
      console.error("Login error:", error);

      return res.status(500).json({
        message: "Login failed",
      });
    }
  });

  return router;
}
