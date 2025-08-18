import { Request, Response } from "express";
import bcrypt from "bcrypt";
import Brand from "../models/Brand";
import { sendBrandEmail } from "../services/emailService";

export const createBrand = async (req: Request, res: Response) => {
  try {
    const { brandEmail } = req.body;

    if (!brandEmail) {
      return res.status(400).json({
        success: false,
        message: "Brand email is required",
      });
    }

    const existingUser = await Brand.findOne({ brandEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A brand already has these credentials",
      });
    }

    const plainPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const brand = new Brand({
      ...req.body,
      password: hashedPassword,
      hasPaid: false,
      isValidated: false,
    });

    await brand.save();

    await sendBrandEmail(brandEmail, plainPassword);

    res.status(201).json({
      success: true,
      message: "Brand registered successfully. Login details sent to email.",
      data: brand,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      success: false,
      message: "Failed to register brand",
      error,
    });
  }
};
