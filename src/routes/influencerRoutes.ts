import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer, { type FileFilterCallback } from "multer";
import type { InfluencerRequest } from "../types/multer";
import { authenticateToken, requireAdmin } from "../middleware/requireHeader";
import {
  createInfluencer,
  getInfluencers,
  getInfluencerById,
  updateInfluencerStatus,
  deleteInfluencer,
  updateInfluencer,
  bulkUpdateInfluencerStatus,
  getInfluencerStats,
  getInfluencerBankDetails,
  updateInfluencerBankDetails,
  verifyInfluencerBankDetails,
} from "../controllers/influencerController";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for Cloudinary upload
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    // Accept images and PDFs only
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDFs files are allowed"));
    }
  },
});

const uploadAny = upload.any();

router.get("/stats", authenticateToken, getInfluencerStats);
router.get("/all-influencers", authenticateToken, getInfluencers);
router.get("/bank-details", authenticateToken, getInfluencerBankDetails);
router.put("/bank-details", authenticateToken, updateInfluencerBankDetails);
router.put(
  "/bulk/status",
  authenticateToken,
  requireAdmin,
  bulkUpdateInfluencerStatus
);
router.post("/createInfluencer", uploadAny, createInfluencer);
router.put(
  "/verify-bank-details",
  authenticateToken,
  requireAdmin,
  verifyInfluencerBankDetails
);
router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  updateInfluencerStatus
);
router.put("/:id", uploadAny, updateInfluencer);
router.delete("/:id", authenticateToken, requireAdmin, deleteInfluencer);
router.get("/:id", getInfluencerById);

export default router;
