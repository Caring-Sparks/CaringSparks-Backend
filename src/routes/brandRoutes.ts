import express from "express";
import { createBrand } from "../controllers/brandController";

const router = express.Router();

router.post("/register", createBrand);

export default router;
