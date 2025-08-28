import { Request, Response } from "express";
import Admin from "../models/Admin";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendOnboardingEmail } from "../services/adminOnboarding";

/**
 * Creates a new admin with a random password and sends an onboarding email.
 * @param req The Express request object.
 * @param res The Express response object.
 */
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, phoneNumber } = req.body;
    // Generate secure password
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

    // Handle specific MongoDB errors
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

/**
 * Fetches a list of all admins from the database.
 * @param req The Express request object.
 * @param res The Express response object.
 */
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await Admin.find().select("-password"); // Exclude password from the response
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

/**
 * Fetches a single admin by their ID.
 * @param req The Express request object, with `id` in `req.params`.
 * @param res The Express response object.
 */
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findById(id).select("-password"); // Exclude password from the response

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

/**
 * Updates an existing admin's details.
 * @param req The Express request object, with `id` in `req.params` and update data in `req.body`.
 * @param res The Express response object.
 */
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If a new password is provided, hash it before updating
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true } // `new: true` returns the updated doc, `runValidators: true` ensures schema validation
    ).select("-password"); // Exclude password from the response

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

/**
 * Deletes an admin from the database by ID.
 * @param req The Express request object, with `id` in `req.params`.
 * @param res The Express response object.
 */
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
