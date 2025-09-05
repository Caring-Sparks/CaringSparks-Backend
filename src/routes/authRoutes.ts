// Add this route to your auth routes file (e.g., routes/auth.ts)
import express from "express";
import {
  loginUser,
  createAdmin,
  refreshToken,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  updateProfile, // Import the new controller method
  deleteAccount, // Import the delete account method
} from "../controllers/authController";

const router = express.Router();

// Existing routes
router.post("/login", loginUser);
router.post("/admin/create", createAdmin);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.post("/verify-email", verifyEmail);

// New routes
router.put("/update-profile", updateProfile);
router.delete("/delete-account", deleteAccount);

export default router;
