// This controller creates an Admin, sends the onboarding email alongside the generated password 

import { Request, Response } from "express";
import Admin from "../models/Admin";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendOnboardingEmail } from "../services/adminOnboarding";

//create a new admin
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, phoneNumber } = req.body;
    const plainPassword = crypto
      .randomBytes(12)
      .toString("base64")
      .slice(0, 12);

    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const admin = new Admin({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phoneNumber,
    });

    await admin.save();

    await sendOnboardingEmail(email, plainPassword);

    res.status(201).json({
      success: true,
      message: "Admin registered successfully. Login details sent to email.",
    });
  } catch (error: any) {
    console.error("Admin registration error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An admin with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error occurred",
    });
  }
};

//get all existing admins
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json({
      success: true,
      data: admins,
    });
  } catch (error: any) {
    console.error("Error fetching all admins:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error occurred",
    });
  }
};

//get a specific admin from the ID
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error: any) {
    console.error("Error fetching admin by ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error occurred",
    });
  }
};

//update an admins details
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (error: any) {
    console.error("Error updating admin:", error);

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

//delete an admin
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedAdmin = await Admin.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error occurred",
    });
  }
};
