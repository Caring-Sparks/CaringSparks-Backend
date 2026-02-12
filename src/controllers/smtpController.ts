import { Request, Response } from "express";
import { sendSmtp } from "../services/smtpEmailService";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, message } = req.body;

    await sendSmtp(name, email, message);

    res.status(201).json({
      success: true,
      message: "Message sent to admin.",
    });
  } catch (error: any) {
    console.error("Admin smtp error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error occurred",
    });
  }
};
