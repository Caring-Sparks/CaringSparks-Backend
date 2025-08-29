import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/requireHeader";
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  loginUser,
  logout,
  refreshToken,
  resetPassword,
  verifyEmail,
} from "../controllers/authController";

const router = Router();

// PUBLIC ROUTES (no authentication required)
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/logout", logout);

// PROTECTED ROUTES (require authentication)
router.get("/me", authenticateToken, getCurrentUser);
router.post("/change-password", authenticateToken, changePassword);

export default router;
