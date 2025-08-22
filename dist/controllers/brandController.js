"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrandStats = exports.deleteBrand = exports.updateBrandDetails = exports.updateBrandValidationStatus = exports.updateBrandPaymentStatus = exports.getBrandById = exports.getAllBrands = exports.createBrand = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const Brand_1 = __importDefault(require("../models/Brand"));
const emailService_1 = require("../services/emailService");
const createBrand = async (req, res) => {
    try {
        const { email, influencersMin, influencersMax, brandPhone } = req.body;
        // Validate required fields
        const requiredFields = [
            "role",
            "platforms",
            "brandName",
            "email",
            "brandPhone",
            "influencersMin",
            "influencersMax",
            "location",
        ];
        const missingFields = requiredFields.filter((field) => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(", ")}`,
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
        // Validate influencer range
        if (influencersMin > influencersMax) {
            return res.status(400).json({
                success: false,
                message: "Minimum influencers cannot be greater than maximum",
            });
        }
        // Validate platforms array
        const validPlatforms = ["Instagram", "X", "TikTok"];
        const { platforms } = req.body;
        if (!Array.isArray(platforms) || platforms.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one platform must be selected",
            });
        }
        const invalidPlatforms = platforms.filter((p) => !validPlatforms.includes(p));
        if (invalidPlatforms.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid platforms: ${invalidPlatforms.join(", ")}`,
            });
        }
        const brandName = req.body.brandName;
        // Check if brand already exists
        const existingBrandEmail = await Brand_1.default.findOne({
            email: email.toLowerCase(),
        });
        const existingBrand = await Brand_1.default.findOne({
            brandName: brandName.toLowerCase(),
        });
        if (existingBrandEmail || existingBrand) {
            return res.status(409).json({
                success: false,
                message: "This brand has already been registered",
            });
        }
        // Generate secure password
        const plainPassword = crypto_1.default
            .randomBytes(12)
            .toString("base64")
            .slice(0, 12);
        const hashedPassword = await bcrypt_1.default.hash(plainPassword, 12);
        // Create brand with all form data
        const brand = new Brand_1.default({
            // Basic brand info
            role: req.body.role,
            platforms: req.body.platforms,
            brandName: req.body.brandName,
            email: email.toLowerCase(),
            brandPhone: req.body.brandPhone,
            // Campaign requirements
            influencersMin: Number(req.body.influencersMin),
            influencersMax: Number(req.body.influencersMax),
            followersRange: req.body.followersRange || "",
            location: req.body.location,
            additionalLocations: req.body.additionalLocations || [],
            postFrequency: req.body.postFrequency || "",
            postDuration: req.body.postDuration || "",
            // Calculated pricing fields from frontend
            avgInfluencers: req.body.avgInfluencers,
            postCount: req.body.postCount,
            costPerInfluencerPerPost: req.body.costPerInfluencerPerPost,
            totalBaseCost: req.body.totalBaseCost,
            platformFee: req.body.platformFee,
            totalCost: req.body.totalCost,
            // System fields
            password: hashedPassword,
            hasPaid: false,
            isValidated: false,
        });
        await brand.save();
        // Send welcome email with login credentials
        await (0, emailService_1.sendBrandEmail)(email, plainPassword, brandName);
        // Return response without sensitive data
        const { password, ...brandData } = brand.toObject();
        res.status(201).json({
            success: true,
            message: "Brand registered successfully. Login details sent to email.",
            data: brandData,
        });
    }
    catch (error) {
        console.error("Brand registration error:", error);
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
                message: "A brand with this email already exists",
            });
        }
        res.status(500).json({
            success: false,
            message: "Internal server error occurred",
        });
    }
};
exports.createBrand = createBrand;
// Get all brands with pagination and filtering
const getAllBrands = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        if (req.query.hasPaid !== undefined) {
            filter.hasPaid = req.query.hasPaid === "true";
        }
        if (req.query.isValidated !== undefined) {
            filter.isValidated = req.query.isValidated === "true";
        }
        if (req.query.platforms) {
            filter.platforms = { $in: req.query.platforms.split(",") };
        }
        if (req.query.location) {
            filter.location = { $regex: req.query.location, $options: "i" };
        }
        // Execute query with pagination
        const brands = await Brand_1.default.find(filter)
            .select("-password") // Exclude password field
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const totalBrands = await Brand_1.default.countDocuments(filter);
        const totalPages = Math.ceil(totalBrands / limit);
        res.status(200).json({
            success: true,
            data: {
                brands,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalBrands,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            },
        });
    }
    catch (error) {
        console.error("Get brands error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve brands",
        });
    }
};
exports.getAllBrands = getAllBrands;
// Get brand by ID
const getBrandById = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await Brand_1.default.findById(id).select("-password");
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }
        res.status(200).json({
            success: true,
            data: brand,
        });
    }
    catch (error) {
        console.error("Get brand by ID error:", error);
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID format",
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to retrieve brand",
        });
    }
};
exports.getBrandById = getBrandById;
// Update brand payment status
const updateBrandPaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { hasPaid } = req.body;
        if (typeof hasPaid !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "hasPaid must be a boolean value",
            });
        }
        const brand = await Brand_1.default.findByIdAndUpdate(id, {
            hasPaid,
            updatedAt: new Date(),
        }, { new: true, select: "-password" });
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }
        res.status(200).json({
            success: true,
            message: `Brand payment status updated to ${hasPaid ? "paid" : "unpaid"}`,
            data: brand,
        });
    }
    catch (error) {
        console.error("Update payment status error:", error);
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID format",
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to update payment status",
        });
    }
};
exports.updateBrandPaymentStatus = updateBrandPaymentStatus;
// Update brand validation status
const updateBrandValidationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isValidated } = req.body;
        if (typeof isValidated !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isValidated must be a boolean value",
            });
        }
        const brand = await Brand_1.default.findByIdAndUpdate(id, {
            isValidated,
            updatedAt: new Date(),
        }, { new: true, select: "-password" });
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }
        res.status(200).json({
            success: true,
            message: `Brand validation status updated to ${isValidated ? "validated" : "unvalidated"}`,
            data: brand,
        });
    }
    catch (error) {
        console.error("Update validation status error:", error);
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID format",
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to update validation status",
        });
    }
};
exports.updateBrandValidationStatus = updateBrandValidationStatus;
// Update brand details
const updateBrandDetails = async (req, res) => {
    try {
        const { id } = req.params;
        // Fields that can be updated
        const allowedUpdates = [
            "brandName",
            "brandPhone",
            "platforms",
            "influencersMin",
            "influencersMax",
            "followersRange",
            "location",
            "additionalLocations",
            "postFrequency",
            "postDuration",
            "avgInfluencers",
            "postCount",
            "costPerInfluencerPerPost",
            "totalBaseCost",
            "platformFee",
            "totalCost",
        ];
        // Filter out non-allowed fields and empty values
        const updates = {};
        Object.keys(req.body).forEach((key) => {
            if (allowedUpdates.includes(key) &&
                req.body[key] !== undefined &&
                req.body[key] !== "") {
                updates[key] = req.body[key];
            }
        });
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields to update",
            });
        }
        // Validate platforms if included
        if (updates.platforms) {
            const validPlatforms = ["Instagram", "X", "TikTok"];
            if (!Array.isArray(updates.platforms) || updates.platforms.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "At least one platform must be selected",
                });
            }
            const invalidPlatforms = updates.platforms.filter((p) => !validPlatforms.includes(p));
            if (invalidPlatforms.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid platforms: ${invalidPlatforms.join(", ")}`,
                });
            }
        }
        // Validate influencer range if both min and max are provided
        if (updates.influencersMin && updates.influencersMax) {
            if (Number(updates.influencersMin) > Number(updates.influencersMax)) {
                return res.status(400).json({
                    success: false,
                    message: "Minimum influencers cannot be greater than maximum",
                });
            }
        }
        // Add updatedAt timestamp
        updates.updatedAt = new Date();
        const brand = await Brand_1.default.findByIdAndUpdate(id, updates, {
            new: true,
            runValidators: true,
            select: "-password",
        });
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Brand details updated successfully",
            data: brand,
        });
    }
    catch (error) {
        console.error("Update brand details error:", error);
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID format",
            });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors: Object.values(error.errors).map((err) => err.message),
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to update brand details",
        });
    }
};
exports.updateBrandDetails = updateBrandDetails;
// Delete brand
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await Brand_1.default.findByIdAndDelete(id);
        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Brand deleted successfully",
            data: {
                deletedBrand: {
                    id: brand._id,
                    brandName: brand.brandName,
                    email: brand.email,
                },
            },
        });
    }
    catch (error) {
        console.error("Delete brand error:", error);
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid brand ID format",
            });
        }
        res.status(500).json({
            success: false,
            message: "Failed to delete brand",
        });
    }
};
exports.deleteBrand = deleteBrand;
// Get brand statistics/dashboard data
const getBrandStats = async (req, res) => {
    try {
        const totalBrands = await Brand_1.default.countDocuments();
        const paidBrands = await Brand_1.default.countDocuments({ hasPaid: true });
        const validatedBrands = await Brand_1.default.countDocuments({ isValidated: true });
        const recentBrands = await Brand_1.default.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        });
        // Platform distribution
        const platformStats = await Brand_1.default.aggregate([
            { $unwind: "$platforms" },
            { $group: { _id: "$platforms", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        // Location distribution (top 10)
        const locationStats = await Brand_1.default.aggregate([
            { $group: { _id: "$location", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);
        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalBrands,
                    paidBrands,
                    validatedBrands,
                    recentBrands,
                },
                platformDistribution: platformStats,
                topLocations: locationStats,
            },
        });
    }
    catch (error) {
        console.error("Get brand stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve brand statistics",
        });
    }
};
exports.getBrandStats = getBrandStats;
