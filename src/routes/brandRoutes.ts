import express from "express";
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getBrandById,
  getBrandStats,
  updateBrandDetails,
  updateBrandValidationStatus,
} from "../controllers/brandController";
import { updateInfluencerStatus } from "../controllers/influencerController";

const router = express.Router();

router.post("/register", createBrand);
router.get("/all-brands", getAllBrands);
router.get("/brand-stats", getBrandStats);
router.get("/:id", getBrandById);
router.put("/:id/payment-status", updateInfluencerStatus);
router.put("/:id/validation-status", updateBrandValidationStatus);
router.put("/update/:id", updateBrandDetails);
router.delete("/delete/:id", deleteBrand);

export default router;
