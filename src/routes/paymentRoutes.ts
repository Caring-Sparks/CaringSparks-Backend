import express from "express";
import { getPaymentStatus, verifyPayment } from "../controllers/paymentController";

const router = express.Router();

// Existing routes
router.post("/api/verify-payment", verifyPayment);
router.get("/api/get-status", getPaymentStatus);

export default router;
