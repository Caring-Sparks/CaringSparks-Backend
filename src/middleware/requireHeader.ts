import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    _id: string;
    email: string;
    role: string;
  };
}

// Authentication middleware
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is required",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const decodedUser = decoded as { id: string; email: string; role?: string };

    req.user = {
      id: decodedUser.id,
      _id: decodedUser.id,
      email: decodedUser.email,
      role: decodedUser.role || "user",
    };

    next();
  });
};

// Admin role middleware
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

// Check if user owns the resource or is admin
export const requireOwnershipOrAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const resourceUserId = req.params.userId || req.body.userId;

  if (req.user.role === "admin" || req.user.id === resourceUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. You can only access your own resources.",
  });
};
