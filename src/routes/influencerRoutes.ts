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

// GET /all-influencers - Get all influencers
router.get("/all-influencers", authenticateToken, getInfluencers);

// BANK DETAILS ROUTES - MUST BE BEFORE /:id ROUTES
router.get("/bank-details", authenticateToken, getInfluencerBankDetails);
router.put("/bank-details", authenticateToken, updateInfluencerBankDetails);

// ADMIN ONLY ROUTES (require admin role)
// PUT /bulk/status - Bulk update status
router.put(
  "/bulk/status",
  authenticateToken,
  requireAdmin,
  bulkUpdateInfluencerStatus
);

// POST /createInfluencer - Create new influencer
router.post("/createInfluencer", uploadAny, createInfluencer);

// ADMIN BANK VERIFICATION ROUTE
router.put(
  "/verify-bank-details",
  authenticateToken,
  requireAdmin,
  verifyInfluencerBankDetails
);

// DYNAMIC ROUTES WITH PARAMETERS (put these last)
// PATCH /:id/status - Update influencer status
router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  updateInfluencerStatus
);

// PUT /:id - Update influencer (with file upload support)
router.put("/:id", uploadAny, updateInfluencer);

// DELETE /:id - Delete influencer
router.delete("/:id", authenticateToken, requireAdmin, deleteInfluencer);

// GET /:id - Get influencer by ID (public profile) - PUT THIS LAST
router.get("/:id", getInfluencerById);

export default router;
