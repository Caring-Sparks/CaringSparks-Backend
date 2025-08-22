import { Router, type Request, type Response, type NextFunction } from "express";
import multer, { type FileFilterCallback } from "multer";
import type { InfluencerRequest } from "../types/multer";
import {
  createInfluencer,
  getInfluencers,
  getInfluencerById,
  updateInfluencerStatus,
  deleteInfluencer,
  updateInfluencer,
  bulkUpdateInfluencerStatus,
  getInfluencerStats,
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
      cb(new Error("Only images and PDF files are allowed"));
    }
  },
});

const uploadAny = upload.any();

// Debug middleware with proper typing
const debugMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next();
};
// GET /stats - Get influencer statistics
router.get("/stats", getInfluencerStats);

// PUT /bulk/status - Bulk update status
router.put("/bulk/status", bulkUpdateInfluencerStatus);

// POST /createInfluencer - Create new influencer
router.post(
  "/createInfluencer",
  debugMiddleware,
  uploadAny,
  createInfluencer
);

// GET / - Get all influencers
router.get("/", getInfluencers);

// GET /:id - Get influencer by ID
router.get("/:id", getInfluencerById);

// PATCH /:id/status - Update influencer status
router.patch("/:id/status", updateInfluencerStatus);

// PUT /:id - Update influencer (with file upload support)
router.put(
  "/:id",
  uploadAny,
  updateInfluencer
);

// DELETE /:id - Delete influencer
router.delete("/:id", deleteInfluencer);

export default router;