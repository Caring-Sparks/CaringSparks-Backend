import { Router } from "express";
import { sendMessage } from "../controllers/smtpController";

const router = Router();

router.post("/send", sendMessage);

export default router;
