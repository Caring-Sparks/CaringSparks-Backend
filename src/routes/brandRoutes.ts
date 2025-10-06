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

router.post("/register", createBrand);
router.get("/all-brands", authenticateToken, getAllBrands);
router.get("/brand-stats", authenticateToken, getBrandStats);
router.put(
  "/:id/payment-status",
  authenticateToken,
  requireAdmin,
  updateInfluencerStatus
);
router.put(
  "/:id/validation-status",
  authenticateToken,
  requireAdmin,
  updateBrandValidationStatus
);
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
router.put("/update/:id", authenticateToken, requireAdmin, updateBrandDetails);
router.delete("/delete/:id", authenticateToken, requireAdmin, deleteBrand);
router.get("/:id", getBrandById);

export default router;
