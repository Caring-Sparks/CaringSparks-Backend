import { Router } from "express";
import { authenticateToken, requireAdmin } from "../middleware/requireHeader";
import {
  deleteAdmin,
  getAdminById,
  getAllAdmins,
  updateAdmin,
  createAdmin,
} from "../controllers/adminController";

const router = Router();

// ADMIN ONLY ROUTES (require admin role)
router.post("/createAdmin", authenticateToken, requireAdmin, createAdmin);
router.get("/all-admins", authenticateToken, requireAdmin, getAllAdmins);
router.get("/:id", authenticateToken, requireAdmin, getAdminById);
router.put("/update/:id", authenticateToken, requireAdmin, updateAdmin);
router.delete("/:id", authenticateToken, requireAdmin, deleteAdmin);

export default router;
