import { Router, type Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import type { Express } from "express-serve-static-core";
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

// POST /api/influencers - Create new influencer
router.post(
  "/createInfluencer",
  (req, res, next) => {
    console.log("[v0] Content-Type:", req.headers["content-type"]);
    console.log("[v0] Request method:", req.method);
    next();
  },
  uploadAny,
  (req, res, next) => {
    console.log(
      "[v0] After multer - Files received:",
      req.files ? req.files.length : "No files"
    );
    console.log("[v0] After multer - Body keys:", Object.keys(req.body || {}));

    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        const value = req.body[key];
        console.log(
          `[v0] Form field: ${key} = ${
            typeof value === "object" ? JSON.stringify(value) : value
          }`
        );
      });
    }

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        console.log(
          `[v0] File received - Field: "${file.fieldname}", Name: "${file.originalname}", Size: ${file.size}`
        );
      });
    }
    next();
  },
  createInfluencer
);

router.get("/", getInfluencers);

router.get("/:id", getInfluencerById);

router.patch("/:id/status", updateInfluencerStatus);

router.delete("/influencers/:id", deleteInfluencer);
router.put("/influencers/:id", updateInfluencer);

router.put("/influencers/bulk/status", bulkUpdateInfluencerStatus);

router.get("/influencers/stats", getInfluencerStats);

export default router;
