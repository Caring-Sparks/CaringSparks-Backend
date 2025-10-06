import express from "express";
import { authenticateToken } from "../middleware/requireHeader";
import {
  getDeliverableStatus,
  submitCampaignDeliverables,
  updateSubmittedDeliverables,
} from "../controllers/deliverablesController";

const router = express.Router();
router.post(
  "/:campaignId/deliverables",
  authenticateToken,
  submitCampaignDeliverables
);
router.get(
  "/:campaignId/deliverables/status",
  authenticateToken,
  getDeliverableStatus
);
router.put(
  "/:campaignId/deliverables",
  authenticateToken,
  updateSubmittedDeliverables
);

export default router;
