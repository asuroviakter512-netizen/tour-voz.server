
import jwt from "jsonwebtoken";

// Verify JWT Token
export default function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        message: "JWT_SECRET is missing",
      });
    }

    const decoded = jwt.verify(token, secret);

    // Normalize role
    req.user = {
      ...decoded,
      role: String(decoded.role || "user")
        .trim()
        .toLowerCase(),
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

// Verify Admin Role
export function verifyAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized. Please login first.",
    });
  }

  const role = String(req.user.role || "")
    .trim()
    .toLowerCase();

  if (role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only.",
    });
  }

  next();
}
