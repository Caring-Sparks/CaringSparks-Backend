import express from "express";
import { authenticateToken } from "../middleware/requireHeader";
import {
  addReview,
  deleteReview,
  getReviews,
  updateReview,
} from "../controllers/reviewController";

const router = express.Router();

router.post("/:campaignId/jobs/:jobId/reviews", authenticateToken, addReview);

router.get("/:campaignId/jobs/:jobId/reviews", authenticateToken, getReviews);

router.patch(
  "/:campaignId/jobs/:jobId/reviews/:reviewId",
  authenticateToken,
  updateReview
);

router.delete(
  "/:campaignId/jobs/:jobId/reviews/:reviewId",
  authenticateToken,
  deleteReview
);
export default router;
