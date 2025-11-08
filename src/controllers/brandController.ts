import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Brand from "../models/Brand";
import Campaign from "../models/Campaign";
import { sendBrandEmail } from "../services/emailService";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import mongoose from "mongoose";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

// Support both images and videos with increased file size
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

// Upload campaign materials (images and videos)
export const uploadCampaignMaterials = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        message: "Campaign ID is required",
      });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const files =
      (req.files as { [fieldname: string]: Express.Multer.File[] })?.media ||
      (req.files as { [fieldname: string]: Express.Multer.File[] })?.images;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    // Parse materials data (descriptions and file types)
    let materialsData: Array<{
      description: string;
      fileType?: string;
      contentType: string;
    }> = [];

    if (req.body.materials && Array.isArray(req.body.materials)) {
      materialsData = req.body.materials.map((material: any) => ({
        description: material.description || "",
        fileType: material.fileType || "image",
        contentType: material.contentType || "",
      }));
    } else {
      const descriptionMap: {
        [key: number]: {
          description?: string;
          fileType?: string;
          contentType?: string;
        };
      } = {};

      Object.keys(req.body).forEach((key) => {
        const descMatch = key.match(/materials\[(\d+)\]\[description\]/);
        const typeMatch = key.match(/materials\[(\d+)\]\[fileType\]/);
        const contentTypeMatch = key.match(/materials\[(\d+)\]\[contentType\]/);

        if (descMatch) {
          const index = Number.parseInt(descMatch[1]);
          if (!descriptionMap[index]) descriptionMap[index] = {};
          descriptionMap[index].description = req.body[key];
        }

        if (typeMatch) {
          const index = Number.parseInt(typeMatch[1]);
          if (!descriptionMap[index]) descriptionMap[index] = {};
          descriptionMap[index].fileType = req.body[key];
        }

        if (contentTypeMatch) {
          const index = Number.parseInt(contentTypeMatch[1]);
          if (!descriptionMap[index]) descriptionMap[index] = {};
          descriptionMap[index].contentType = req.body[key];
        }
      });

      // Convert map to array
      Object.keys(descriptionMap).forEach((key) => {
        const index = Number.parseInt(key);
        materialsData[index] = {
          description: descriptionMap[index].description || "",
          fileType: descriptionMap[index].fileType || "image",
          contentType: descriptionMap[index].contentType || "",
        };
      });
    }

    // Upload to Cloudinary with support for both images and videos
    const uploadPromises = files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const isVideo = file.mimetype.startsWith("video/");
        const fileType =
          materialsData[index]?.fileType || (isVideo ? "video" : "image");

        const uploadOptions: any = {
          folder: "campaign-materials",
          resource_type: isVideo ? "video" : "image",
        };

        if (isVideo) {
          // Video-specific options
          uploadOptions.allowed_formats = [
            "mp4",
            "mov",
            "avi",
            "wmv",
            "flv",
            "webm",
          ];
          uploadOptions.transformation = [
            {
              width: 1920,
              height: 1080,
              crop: "limit",
              quality: "auto",
              fetch_format: "auto",
            },
          ];
        } else {
          // Image-specific options
          uploadOptions.allowed_formats = ["jpg", "jpeg", "png", "gif", "webp"];
          uploadOptions.transformation = [
            {
              width: 1000,
              height: 1000,
              crop: "limit",
              quality: "auto",
            },
          ];
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error(`Upload error for file ${index}:`, error);
              reject(error);
            } else {
              const description = materialsData[index]?.description || "";
              resolve({
                imageUrl: result?.secure_url,
                postDescription: description,
                fileType: fileType,
                mediaType: isVideo ? "video" : "image",
                contentType: materialsData[index]?.contentType || "",
                duration: result?.duration,
                format: result?.format,
                width: result?.width,
                height: result?.height,
              });
            }
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    // Wait for all uploads to complete
    const campaignMaterials: any = await Promise.all(uploadPromises);

    // Add to campaign
    campaign.campaignMaterials.push(...campaignMaterials);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Successfully uploaded ${campaignMaterials.length} campaign material(s)`,
      data: {
        campaignId: campaign._id,
        materialsCount: campaignMaterials.length,
        materials: campaignMaterials,
      },
    });
  } catch (error: any) {
    console.error("Upload campaign materials error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    if (error.message === "Only image and video files are allowed") {
      return res.status(400).json({
        success: false,
        message: "Only image and video files are allowed",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload campaign materials",
      error: error.message,
    });
  }
};

// Get campaign materials
export const getCampaignMaterials = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId).select(
      "campaignMaterials brandName"
    );
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        campaignId: campaign._id,
        brandName: campaign.brandName,
        materials: campaign.campaignMaterials,
      },
    });
  } catch (error: any) {
    console.error("Get campaign materials error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve campaign materials",
    });
  }
};

// Delete campaign material
export const deleteCampaignMaterial = async (req: Request, res: Response) => {
  try {
    const { campaignId, materialId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Find and remove the material
    const materialIndex = campaign.campaignMaterials.findIndex(
      (material: any) => material._id.toString() === materialId
    );

    if (materialIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Material not found",
      });
    }

    const material = campaign.campaignMaterials[materialIndex];

    // Delete from Cloudinary as well
    try {
      const publicId = material.imageUrl.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(`campaign-materials/${publicId}`);
      }
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
    }

    // Remove from database
    campaign.campaignMaterials.splice(materialIndex, 1);
    await campaign.save();

    res.status(200).json({
      success: true,
      message: "Campaign material deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete campaign material error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete campaign material",
    });
  }
};

// create a new brand
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

    // Further validation
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

    // Generate the random password
    const plainPassword = crypto
      .randomBytes(12)
      .toString("base64")
      .slice(0, 12);
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

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

    const campaign = new Campaign({
      userId: brand._id,
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

    // Send the Email
    await sendBrandEmail(email, plainPassword, brandName);

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
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 10;
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

    const brands = await Brand.find(filter)
      .select("-password")
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

    // Validate the ID format first
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID format",
      });
    }

    // Check if brand exists before deletion
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Find all campaigns associated with this brand's userId
    const associatedCampaigns = await Campaign.find({ userId: id });

    // Start a transaction to ensure data consistency
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete all associated campaigns first
        if (associatedCampaigns.length > 0) {
          await Campaign.deleteMany({ userId: id }, { session });
        }

        await Brand.findByIdAndDelete(id, { session });
      });

      await session.endSession();

      res.status(200).json({
        success: true,
        message: "Brand and associated campaigns deleted successfully",
        data: {
          deletedBrand: {
            id: brand._id,
            brandName: brand.brandName,
            email: brand.email,
          },
          deletedCampaigns: {
            count: associatedCampaigns.length,
            campaigns: associatedCampaigns.map((campaign) => ({
              id: campaign._id,
              brandName: campaign.brandName,
              platforms: campaign.platforms,
              createdAt: campaign.createdAt,
            })),
          },
        },
      });
    } catch (transactionError) {
      await session.endSession();
      throw transactionError;
    }
  } catch (error: any) {
    console.error("Delete brand error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID format",
      });
    }

    if (error.name === "MongoServerError" && error.code === 11000) {
      return res.status(500).json({
        success: false,
        message: "Database constraint error during deletion",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete brand and associated campaigns",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get brand statistics/dashboard data(pending usage)
export const getBrandStats = async (req: Request, res: Response) => {
  try {
    const totalBrands = await Brand.countDocuments();
    const paidBrands = await Brand.countDocuments({ hasPaid: true });
    const validatedBrands = await Brand.countDocuments({ isValidated: true });
    const recentBrands = await Brand.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
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
