import { Router } from "express";
import {
  changePassword,
  createAdmin,
  forgotPassword,
  getCurrentUser,
  loginUser,
  logout,
  refreshToken,
  resetPassword,
  verifyEmail,
} from "../controllers/authController";

const router = Router();

router.post("/login", loginUser);
router.post("/createAdmin", createAdmin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.post("/verify-email", verifyEmail);

export default router;
