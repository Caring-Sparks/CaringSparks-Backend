// controllers/brandController.ts
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Brand from "../models/Brand";
import Campaign from "../models/Campaign";
import { sendBrandEmail } from "../services/emailService";

export const createBrand = async (req: Request, res: Response) => {
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    // Influencer range check
    if (influencersMin > influencersMax) {
      return res.status(400).json({
        success: false,
        message: "Minimum influencers cannot be greater than maximum",
      });
    }

    // Platforms validation
    const validPlatforms = [
      "Instagram",
      "X",
      "TikTok",
      "Youtube",
      "Facebook",
      "Linkedin",
      "Threads",
      "Discord",
      "Snapchat",
    ];
    const { platforms } = req.body;
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one platform must be selected",
      });
    }
    const invalidPlatforms = platforms.filter(
      (p) => !validPlatforms.includes(p)
    );
    if (invalidPlatforms.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid platforms: ${invalidPlatforms.join(", ")}`,
      });
    }

    // Check if brand already exists
    const brandName = req.body.brandName;
    const existingBrandEmail = await Brand.findOne({
      email: email.toLowerCase(),
    });
    const existingBrand = await Brand.findOne({
      brandName: brandName.toLowerCase(),
    });

    if (existingBrandEmail || existingBrand) {
      return res.status(409).json({
        success: false,
        message: "This brand has already been registered",
      });
    }

    // Generate password
    const plainPassword = crypto
      .randomBytes(12)
      .toString("base64")
      .slice(0, 12);
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // --- STEP 1: Create Brand (main model) ---
    const brand = new Brand({
      role: req.body.role,
      platforms: req.body.platforms,
      brandName: req.body.brandName,
      email: email.toLowerCase(),
      brandPhone: req.body.brandPhone,
      influencersMin: Number(req.body.influencersMin),
      influencersMax: Number(req.body.influencersMax),
      followersRange: req.body.followersRange || "",
      location: req.body.location,
      additionalLocations: req.body.additionalLocations || [],
      postFrequency: req.body.postFrequency || "",
      postDuration: req.body.postDuration || "",
      avgInfluencers: req.body.avgInfluencers,
      postCount: req.body.postCount,
      costPerInfluencerPerPost: req.body.costPerInfluencerPerPost,
      totalBaseCost: req.body.totalBaseCost,
      platformFee: req.body.platformFee,
      totalCost: req.body.totalCost,
      password: hashedPassword,
      hasPaid: false,
      isValidated: false,
    });

    await brand.save();

    // --- STEP 2: Save into Campaign collection with SAME _id ---
    const campaign = new Campaign({
      role: brand.role,
      platforms: brand.platforms,
      brandName: brand.brandName,
      email: brand.email,
      brandPhone: brand.brandPhone,
      influencersMin: brand.influencersMin,
      influencersMax: brand.influencersMax,
      followersRange: brand.followersRange,
      location: brand.location,
      additionalLocations: brand.additionalLocations,
      postFrequency: brand.postFrequency,
      postDuration: brand.postDuration,
      avgInfluencers: brand.avgInfluencers,
      postCount: brand.postCount,
      costPerInfluencerPerPost: brand.costPerInfluencerPerPost,
      totalBaseCost: brand.totalBaseCost,
      platformFee: brand.platformFee,
      totalCost: brand.totalCost,
      hasPaid: brand.hasPaid,
      isValidated: brand.isValidated,
    });

    await campaign.save();

    // --- STEP 3: Send Email ---
    await sendBrandEmail(email, plainPassword, brandName);

    // Response
    const { password, ...brandData } = brand.toObject();
    res.status(201).json({
      success: true,
      message: "Brand registered successfully. Login details sent to email.",
      data: brandData,
    });
  } catch (error: any) {
    console.error("Brand registration error:", error);

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
        message: "A brand with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error occurred",
    });
  }
};

// Get all brands with pagination and filtering
export const getAllBrands = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    if (req.query.hasPaid !== undefined) {
      filter.hasPaid = req.query.hasPaid === "true";
    }

    if (req.query.isValidated !== undefined) {
      filter.isValidated = req.query.isValidated === "true";
    }

    if (req.query.platforms) {
      filter.platforms = { $in: (req.query.platforms as string).split(",") };
    }

    if (req.query.location) {
      filter.location = { $regex: req.query.location, $options: "i" };
    }

    // Execute query with pagination
    const brands = await Brand.find(filter)
      .select("-password") // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalBrands = await Brand.countDocuments(filter);
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
  } catch (error: any) {
    console.error("Get brands error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve brands",
    });
  }
};

// Get brand by ID
export const getBrandById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id).select("-password");

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
  } catch (error: any) {
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

// Update brand payment status
export const updateBrandPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hasPaid } = req.body;

    if (typeof hasPaid !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "hasPaid must be a boolean value",
      });
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        hasPaid,
        updatedAt: new Date(),
      },
      { new: true, select: "-password" }
    );

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
  } catch (error: any) {
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

// Update brand validation status
export const updateBrandValidationStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { isValidated } = req.body;

    if (typeof isValidated !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isValidated must be a boolean value",
      });
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      {
        isValidated,
        updatedAt: new Date(),
      },
      { new: true, select: "-password" }
    );

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Brand validation status updated to ${
        isValidated ? "validated" : "unvalidated"
      }`,
      data: brand,
    });
  } catch (error: any) {
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

// Update brand details
export const updateBrandDetails = async (req: Request, res: Response) => {
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
    const updates: any = {};
    Object.keys(req.body).forEach((key) => {
      if (
        allowedUpdates.includes(key) &&
        req.body[key] !== undefined &&
        req.body[key] !== ""
      ) {
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

      const invalidPlatforms = updates.platforms.filter(
        (p: any) => !validPlatforms.includes(p)
      );
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

    const brand = await Brand.findByIdAndUpdate(id, updates, {
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
  } catch (error: any) {
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
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update brand details",
    });
  }
};

// Delete brand
export const deleteBrand = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByIdAndDelete(id);

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
  } catch (error: any) {
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

// Get brand statistics/dashboard data
export const getBrandStats = async (req: Request, res: Response) => {
  try {
    const totalBrands = await Brand.countDocuments();
    const paidBrands = await Brand.countDocuments({ hasPaid: true });
    const validatedBrands = await Brand.countDocuments({ isValidated: true });
    const recentBrands = await Brand.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    });

    // Platform distribution
    const platformStats = await Brand.aggregate([
      { $unwind: "$platforms" },
      { $group: { _id: "$platforms", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Location distribution (top 10)
    const locationStats = await Brand.aggregate([
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
  } catch (error: any) {
    console.error("Get brand stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve brand statistics",
    });
  }
};
