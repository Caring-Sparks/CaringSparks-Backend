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
  respondToCampaignAssignment,
  unassignInfluencersFromCampaign,
} from "../controllers/campaignController";
import { authenticateToken } from "../middleware/requireHeader";

const router = Router();

router.get("/", getAllCampaigns);
router.get("/:id", getCampaignById);
router.get("/:influencerId/campaigns", getAssignedCampaigns);
router.post("/newCampaign", createCampaign);
router.get("/email/:email", getCampaignsByEmail);
router.put("/:id", updateCampaign);
router.post("/:id/assign", assignInfluencersToCampaign);
router.post("/:id/unassign", unassignInfluencersFromCampaign);
router.put("/:id/payment", updatePaymentStatus);
router.patch(
  "/:campaignId/respond",
  authenticateToken,
  respondToCampaignAssignment
);
router.delete("/:id", deleteCampaign);

export default router;
