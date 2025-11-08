import express from "express";
import { authenticateToken } from "../middleware/requireHeader";
import {
  getDeliverableStatus,
  submitCampaignDeliverables,
  updateSubmittedDeliverables,
  stashDeliverables,
  getStashedDeliverables,
  deleteStashedDeliverables,
  deleteStash,
  markCampaignAsComplete,
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

router.post(
  "/:campaignId/stash-deliverables",
  authenticateToken,
  stashDeliverables
);

router.get(
  "/:campaignId/stashed-deliverables",
  authenticateToken,
  getStashedDeliverables
);

router.delete(
  "/:campaignId/stashed-deliverables",
  authenticateToken,
  deleteStashedDeliverables
);

router.delete("/:campaignId/stash/:stashId", authenticateToken, deleteStash);

router.post(
  "/:campaignId/mark-complete",
  authenticateToken,
  markCampaignAsComplete
);

export default router;
