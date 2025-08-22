"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const influencerController_1 = require("../controllers/influencerController");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // Store files in memory for Cloudinary upload
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
    },
    fileFilter: (req, file, cb) => {
        // Accept images and PDFs only
        if (file.mimetype.startsWith("image/") ||
            file.mimetype === "application/pdf") {
            cb(null, true);
        }
        else {
            cb(new Error("Only images and PDF files are allowed"));
        }
    },
});
const uploadAny = upload.any();
// Debug middleware with proper typing
const debugMiddleware = (req, res, next) => {
    next();
};
// GET /stats - Get influencer statistics
router.get("/stats", influencerController_1.getInfluencerStats);
// PUT /bulk/status - Bulk update status
router.put("/bulk/status", influencerController_1.bulkUpdateInfluencerStatus);
// POST /createInfluencer - Create new influencer
router.post("/createInfluencer", debugMiddleware, uploadAny, influencerController_1.createInfluencer);
// GET / - Get all influencers
router.get("/", influencerController_1.getInfluencers);
// GET /:id - Get influencer by ID
router.get("/:id", influencerController_1.getInfluencerById);
// PATCH /:id/status - Update influencer status
router.patch("/:id/status", influencerController_1.updateInfluencerStatus);
// PUT /:id - Update influencer (with file upload support)
router.put("/:id", uploadAny, influencerController_1.updateInfluencer);
// DELETE /:id - Delete influencer
router.delete("/:id", influencerController_1.deleteInfluencer);
exports.default = router;
