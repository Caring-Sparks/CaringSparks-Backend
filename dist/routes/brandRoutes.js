"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const brandController_1 = require("../controllers/brandController");
const influencerController_1 = require("../controllers/influencerController");
const router = express_1.default.Router();
router.post("/register", brandController_1.createBrand);
router.get("/all-brands", brandController_1.getAllBrands);
router.get("/brand-stats", brandController_1.getBrandStats);
router.get("/:id", brandController_1.getBrandById);
router.put("/:id/payment-status", influencerController_1.updateInfluencerStatus);
router.put("/:id/validation-status", brandController_1.updateBrandValidationStatus);
router.put("/update/:id", brandController_1.updateBrandDetails);
router.delete("/delete/:id", brandController_1.deleteBrand);
exports.default = router;
