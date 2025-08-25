import { Request, Response } from "express";
import Brand from "../models/Brand";
import Influencer from "../models/Influencer";
import Admin from "../models/Admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Model } from "mongoose";
import {
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
} from "../services/authEmailServices";
import { sendOnboardingEmail } from "../services/adminOnboarding";

const generateToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
};

const generateRefreshToken = (id: string, role: string) => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    // Input validation
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and role are required",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Role validation
    const validRoles = ["brand", "influencer", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be one of: brand, influencer, admin",
      });
    }

    // Map role to corresponding model
    const roleModelMap: { [key: string]: { model: Model<any>; role: string } } =
      {
        brand: { model: Brand, role: "brand" },
        influencer: { model: Influencer, role: "influencer" },
        admin: { model: Admin, role: "admin" },
      };

    const { model } = roleModelMap[role];

    // Find user in the specific role's collection
    const user = await model.findOne({ email: email.toLowerCase() }).exec();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials or role mismatch",
      });
    }

    // Check if account is active (for influencers)
    if (role === "influencer" && user.status === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Account has been rejected. Please contact support.",
      });
    }

    // Additional status checks for other roles if needed
    if (role === "influencer" && user.status === "pending") {
      return res.status(403).json({
        success: false,
        message:
          "Account is pending approval. Please wait for admin verification.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id.toString(), role);
    const refreshToken = generateRefreshToken(user._id.toString(), role);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          role,
          // Include additional user info based on role if needed
          ...(role === "influencer" && { status: user.status }),
          ...(role === "brand" && { companyName: user.companyName }),
          ...(role === "admin" && { permissions: user.permissions }),
        },
        token,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Generate secure password
    const plainPassword = crypto
      .randomBytes(12)
      .toString("base64")
      .slice(0, 12);
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const admin = new Admin({
      email: email.toLowerCase(),
      password: hashedPassword,
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

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not provided",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as any;

    const userModels: { model: Model<any>; role: string }[] = [
      { model: Brand, role: "brand" },
      { model: Influencer, role: "influencer" },
      { model: Admin, role: "admin" },
    ];

    let user: any = null;
    let role = "";

    for (const { model, role: r } of userModels) {
      if (decoded.role === r) {
        const foundUser = await model.findById(decoded.id).exec();
        if (foundUser) {
          user = foundUser;
          role = r;
          break;
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newToken = generateToken(user._id.toString(), role);
    const newRefreshToken = generateRefreshToken(user._id.toString(), role);

    // Set new refresh token as httpOnly cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error: any) {
    console.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const userModels: { model: Model<any>; role: string }[] = [
      { model: Brand, role: "brand" },
      { model: Influencer, role: "influencer" },
      { model: Admin, role: "admin" },
    ];

    let user: any = null;
    let role = "";

    for (const { model, role: r } of userModels) {
      if (decoded.role === r) {
        const foundUser = await model
          .findById(decoded.id)
          .select("-password")
          .exec();
        if (foundUser) {
          user = foundUser;
          role = r;
          break;
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          role,
        },
      },
    });
  } catch (error: any) {
    console.error("Get current user error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const userModels: { model: Model<any>; role: string }[] = [
      { model: Brand, role: "brand" },
      { model: Influencer, role: "influencer" },
      { model: Admin, role: "admin" },
    ];

    let user: any = null;
    let role = "";

    for (const { model, role: r } of userModels) {
      const foundUser = await model
        .findOne({ email: email.toLowerCase() })
        .exec();
      if (foundUser) {
        user = foundUser;
        role = r;
        break;
      }
    }

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save reset token to user
    await user.updateOne({
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpiry,
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, role);
    } catch (emailError) {
      console.error("Password reset email error:", emailError);
      // Reset the token fields if email fails
      await user.updateOne({
        passwordResetToken: undefined,
        passwordResetExpires: undefined,
      });

      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword, role } = req.body;

    if (!token || !newPassword || !role) {
      return res.status(400).json({
        success: false,
        message: "Token, new password, and role are required",
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const userModels: { [key: string]: Model<any> } = {
      brand: Brand,
      influencer: Influencer,
      admin: Admin,
    };

    const model = userModels[role];
    if (!model) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await model
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      })
      .exec();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password and clear reset token
    await user.updateOne({
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      isValidated: true,
    });

    // Send confirmation email
    try {
      await sendPasswordResetConfirmationEmail(user.email);
    } catch (emailError) {
      console.error("Password reset confirmation email error:", emailError);
      // Continue execution even if email fails
    }

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};

// Change password (for authenticated users)
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const userModels: { model: Model<any>; role: string }[] = [
      { model: Brand, role: "brand" },
      { model: Influencer, role: "influencer" },
      { model: Admin, role: "admin" },
    ];

    let user: any = null;

    for (const { model, role: r } of userModels) {
      if (decoded.role === r) {
        const foundUser = await model.findById(decoded.id).exec();
        if (foundUser) {
          user = foundUser;
          break;
        }
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.updateOne({ password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: any) {
    console.error("Change password error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};

// Verify email token (if you have email verification)
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token, role } = req.body;

    if (!token || !role) {
      return res.status(400).json({
        success: false,
        message: "Token and role are required",
      });
    }

    const userModels: { [key: string]: Model<any> } = {
      brand: Brand,
      influencer: Influencer,
      admin: Admin,
    };

    const model = userModels[role];
    if (!model) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await model
      .findOne({
        emailVerificationToken: token,
      })
      .exec();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    // Mark email as verified
    await user.updateOne({
      isEmailVerified: true,
      emailVerificationToken: undefined,
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error: any) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred",
    });
  }
};
