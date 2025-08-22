"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.getCurrentUser = exports.logout = exports.refreshToken = exports.createAdmin = exports.loginUser = void 0;
const Brand_1 = __importDefault(require("../models/Brand"));
const Influencer_1 = __importDefault(require("../models/Influencer"));
const Admin_1 = __importDefault(require("../models/Admin"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const authEmailServices_1 = require("../services/authEmailServices");
const adminOnboarding_1 = require("../services/adminOnboarding");
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
};
const generateRefreshToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
    });
};
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Input validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
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
        // Explicitly tell TS that model is a mongoose Model
        const userModels = [
            { model: Brand_1.default, role: "brand" },
            { model: Influencer_1.default, role: "influencer" },
            { model: Admin_1.default, role: "admin" },
        ];
        let user = null;
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
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        // Check if account is active (for influencers)
        if (role === "influencer" && user.status === "rejected") {
            return res.status(403).json({
                success: false,
                message: "Account has been rejected. Please contact support.",
            });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            });
        }
        // Update last login
        await user.updateOne({ lastLogin: new Date() });
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
                },
                token,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error occurred",
        });
    }
};
exports.loginUser = loginUser;
const createAdmin = async (req, res) => {
    try {
        const { email } = req.body;
        // Generate secure password
        const plainPassword = crypto_1.default
            .randomBytes(12)
            .toString("base64")
            .slice(0, 12);
        const hashedPassword = await bcryptjs_1.default.hash(plainPassword, 12);
        const admin = new Admin_1.default({
            email: email.toLowerCase(),
            password: hashedPassword,
        });
        await admin.save();
        await (0, adminOnboarding_1.sendOnboardingEmail)(email, plainPassword);
        res.status(201).json({
            success: true,
            message: "Admin registered successfully. Login details sent to email.",
        });
    }
    catch (error) {
        console.error("Admin registration error:", error);
        // Handle specific MongoDB errors
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map((err) => err.message),
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
exports.createAdmin = createAdmin;
// Refresh token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token not provided",
            });
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const userModels = [
            { model: Brand_1.default, role: "brand" },
            { model: Influencer_1.default, role: "influencer" },
            { model: Admin_1.default, role: "admin" },
        ];
        let user = null;
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
    }
    catch (error) {
        console.error("Refresh token error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid refresh token",
        });
    }
};
exports.refreshToken = refreshToken;
// Logout
const logout = async (req, res) => {
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
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            message: "Server error occurred",
        });
    }
};
exports.logout = logout;
// Get current user profile
const getCurrentUser = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userModels = [
            { model: Brand_1.default, role: "brand" },
            { model: Influencer_1.default, role: "influencer" },
            { model: Admin_1.default, role: "admin" },
        ];
        let user = null;
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
    }
    catch (error) {
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
exports.getCurrentUser = getCurrentUser;
// Forgot password
const forgotPassword = async (req, res) => {
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
        const userModels = [
            { model: Brand_1.default, role: "brand" },
            { model: Influencer_1.default, role: "influencer" },
            { model: Admin_1.default, role: "admin" },
        ];
        let user = null;
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
                message: "If an account with that email exists, a password reset link has been sent.",
            });
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        // Save reset token to user
        await user.updateOne({
            passwordResetToken: resetToken,
            passwordResetExpires: resetTokenExpiry,
        });
        // Send reset email
        try {
            await (0, authEmailServices_1.sendPasswordResetEmail)(user.email, resetToken, role);
        }
        catch (emailError) {
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
    }
    catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Server error occurred",
        });
    }
};
exports.forgotPassword = forgotPassword;
// Reset password
const resetPassword = async (req, res) => {
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
        const userModels = {
            brand: Brand_1.default,
            influencer: Influencer_1.default,
            admin: Admin_1.default,
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
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        // Update user password and clear reset token
        await user.updateOne({
            password: hashedPassword,
            passwordResetToken: undefined,
            passwordResetExpires: undefined,
        });
        // Send confirmation email
        try {
            await (0, authEmailServices_1.sendPasswordResetConfirmationEmail)(user.email);
        }
        catch (emailError) {
            console.error("Password reset confirmation email error:", emailError);
            // Continue execution even if email fails
        }
        res.status(200).json({
            success: true,
            message: "Password reset successful",
        });
    }
    catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Server error occurred",
        });
    }
};
exports.resetPassword = resetPassword;
// Change password (for authenticated users)
const changePassword = async (req, res) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const userModels = [
            { model: Brand_1.default, role: "brand" },
            { model: Influencer_1.default, role: "influencer" },
            { model: Admin_1.default, role: "admin" },
        ];
        let user = null;
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
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }
        // Check if new password is different from current
        const isSamePassword = await bcryptjs_1.default.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password",
            });
        }
        // Hash new password
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
        // Update password
        await user.updateOne({ password: hashedNewPassword });
        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    }
    catch (error) {
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
exports.changePassword = changePassword;
// Verify email token (if you have email verification)
const verifyEmail = async (req, res) => {
    try {
        const { token, role } = req.body;
        if (!token || !role) {
            return res.status(400).json({
                success: false,
                message: "Token and role are required",
            });
        }
        const userModels = {
            brand: Brand_1.default,
            influencer: Influencer_1.default,
            admin: Admin_1.default,
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
    }
    catch (error) {
        console.error("Verify email error:", error);
        res.status(500).json({
            success: false,
            message: "Server error occurred",
        });
    }
};
exports.verifyEmail = verifyEmail;
