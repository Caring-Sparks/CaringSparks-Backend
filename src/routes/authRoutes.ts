import express from "express";
import {
  loginUser,
  refreshToken,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  updateProfile,
  deleteAccount,
} from "../controllers/authController";

const router = express.Router();

router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.post("/verify-email", verifyEmail);
router.put("/update-profile", updateProfile);
router.delete("/delete-account", deleteAccount);

export default router;
