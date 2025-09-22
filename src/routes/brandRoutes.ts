import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/requireHeader";
import {
  createBrand,
  deleteBrand,
  deleteCampaignMaterial,
  getAllBrands,
  getBrandById,
  getBrandStats,
  getCampaignMaterials,
  updateBrandDetails,
  updateBrandValidationStatus,
  upload,
  uploadCampaignMaterials,
} from "../controllers/brandController";
import { updateInfluencerStatus } from "../controllers/influencerController";

const router = express.Router();

// PUBLIC ROUTES (no authentication required)
// POST /register - Brand registration (brands can self-register)
router.post("/register", createBrand);

// PROTECTED ROUTES (require authentication)
// PUT THESE SPECIFIC ROUTES BEFORE THE DYNAMIC /:id ROUTE
// GET /all-brands - Get all brands (for logged-in users)
router.get("/all-brands", authenticateToken, getAllBrands);

// GET /brand-stats - Get brand statistics
router.get("/brand-stats", authenticateToken, getBrandStats);

// ADMIN ONLY ROUTES (require admin role)
// PUT /:id/payment-status - Update payment status
router.put(
  "/:id/payment-status",
  authenticateToken,
  requireAdmin,
  updateInfluencerStatus
);

// PUT /:id/validation-status - Update brand validation status
router.put(
  "/:id/validation-status",
  authenticateToken,
  requireAdmin,
  updateBrandValidationStatus
);

// Campaign materials routes
router.post(
  "/upload-materials",
  upload.fields([{ name: "images", maxCount: 10 }]),
  uploadCampaignMaterials
);
router.get("/:campaignId/materials", getCampaignMaterials);
router.delete(
  "/:campaignId/materials/:materialId",
  deleteCampaignMaterial
);
// PUT /update/:id - Update brand details
router.put("/update/:id", authenticateToken, requireAdmin, updateBrandDetails);

// DELETE /delete/:id - Delete brand
router.delete("/delete/:id", authenticateToken, requireAdmin, deleteBrand);

// DYNAMIC ROUTE - PUT THIS LAST
// GET /:id - Get brand by ID (public brand profile)
router.get("/:id", getBrandById);

export default router;
