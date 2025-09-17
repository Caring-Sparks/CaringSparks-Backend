import { Router } from "express";
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  getCampaignsByEmail,
  updateCampaign,
  updatePaymentStatus,
  deleteCampaign,
  assignInfluencersToCampaign,
  getAssignedCampaigns,
} from "../controllers/campaignController";

const router = Router();

// =====================
// Public Routes (if any)
// =====================
// Get all campaigns with filtering (might be used by admin or public discovery)
router.get("/", getAllCampaigns);

// Get campaign by ID (public view)
router.get("/:id", getCampaignById);

router.get("/:influencerId/campaigns", getAssignedCampaigns);

// =====================
// Protected Routes (require authentication)
// =====================

// Create new campaign
router.post("/newCampaign", createCampaign);

// Get campaigns by email (user's own campaigns)
router.get("/email/:email", getCampaignsByEmail);

// Update campaign by ID
router.put("/:id", updateCampaign);

router.post("/:id/assign", assignInfluencersToCampaign);

// Update payment status (dedicated endpoint)
router.put("/:id/payment", updatePaymentStatus);

// Delete campaign by ID
router.delete("/:id", deleteCampaign);

// =====================
// Admin Routes (if needed - require admin authentication)
// =====================
// You might want to add admin-specific routes like:
// router.get("/admin/all", adminAuthMiddleware, getAllCampaignsForAdmin);
// router.put("/:id/validate", adminAuthMiddleware, validateCampaignByAdmin);

export default router;
