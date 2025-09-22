// In your routes file (e.g., campaignRoutes.ts)
import express from "express";
import { authenticateToken } from "../middleware/requireHeader";
import {
  getDeliverableStatus,
  submitCampaignDeliverables,
  updateSubmittedDeliverables,
} from "../controllers/deliverablesController";

const router = express.Router();

// Submit deliverables for a campaign
router.post(
  "/:campaignId/deliverables",
  authenticateToken,
  submitCampaignDeliverables
);

// Get deliverable status for a campaign
router.get(
  "/:campaignId/deliverables/status",
  authenticateToken,
  getDeliverableStatus
);

// Update submitted deliverables
router.put(
  "/:campaignId/deliverables",
  authenticateToken,
  updateSubmittedDeliverables
);

export default router;
