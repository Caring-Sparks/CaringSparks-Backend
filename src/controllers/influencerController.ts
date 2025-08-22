import type { Request, Response } from "express";
import type { InfluencerRequest } from "../types/multer";
import cloudinary from "../utils/cloudinary";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Influencer from "../models/Influencer";
import {
  sendInfluencerWelcomeEmail,
  sendAdminNotificationEmail,
} from "../services/influencerEmailService";

export const createInfluencer = async (
  req: InfluencerRequest,
  res: Response
) => {
  try {
    const filesMap: { [key: string]: Express.Multer.File } = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        filesMap[file.fieldname] = file;
      });
    }

    // Parse JSON strings from FormData
    const parsedBody = { ...req.body };
    Object.keys(parsedBody).forEach((key) => {
      if (typeof parsedBody[key] === "string") {
        try {
          const parsed = JSON.parse(parsedBody[key]);
          if (typeof parsed === "object") {
            parsedBody[key] = parsed;
          }
        } catch (e) {
          // Not JSON, keep as string
        }
      }
    });

    const {
      name,
      email,
      phone,
      whatsapp,
      location,
      niches,
      audienceLocation,
      malePercentage,
      femalePercentage,
    } = parsedBody;

    // Validate required fields
    const requiredFields = ["name", "email", "phone", "whatsapp", "location"];
    const missingFields = requiredFields.filter((field) => !parsedBody[field]);

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

    // Validate niches
    const parsedNiches =
      typeof niches === "string" ? JSON.parse(niches) : niches;
    if (!Array.isArray(parsedNiches) || parsedNiches.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one niche must be selected",
      });
    }

    // Check for existing influencer
    const existingInfluencer = await Influencer.findOne({
      email: email.toLowerCase(),
    });
    if (existingInfluencer) {
      return res.status(409).json({
        success: false,
        message: "An influencer with this email already exists",
      });
    }

    // Generate secure password
    const plainPassword = crypto
      .randomBytes(12)
      .toString("base64")
      .slice(0, 12);
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    const influencerData: any = {
      name,
      email: email.toLowerCase(),
      phone,
      whatsapp,
      password: hashedPassword,
      location,
      niches: parsedNiches,
      audienceLocation,
      malePercentage,
      femalePercentage,
      status: "pending",
      emailSent: false,

      // Add calculated earnings fields from frontend
      followerFee: parsedBody.followerFee,
      impressionFee: parsedBody.impressionFee,
      locationFee: parsedBody.locationFee,
      nicheFee: parsedBody.nicheFee,
      earningsPerPost: parsedBody.earningsPerPost,
      earningsPerPostNaira: parsedBody.earningsPerPostNaira,
      maxMonthlyEarnings: parsedBody.maxMonthlyEarnings,
      maxMonthlyEarningsNaira: parsedBody.maxMonthlyEarningsNaira,
      followersCount: parsedBody.followersCount,
    };

    const platforms = ["instagram", "twitter", "tiktok", "youtube", "facebook"];
    const uploadPromises: Promise<any>[] = [];

    for (const platform of platforms) {
      const platformData = parsedBody[platform];
      console.log(`[v0] Processing ${platform}:`, platformData);

      if (platformData && typeof platformData === "object") {
        const { followers, url, impressions } = platformData;

        if (followers && url && impressions) {
          // Validate platform data
          if (isNaN(Number(followers)) || Number(followers) < 0) {
            return res.status(400).json({
              success: false,
              message: `Invalid followers count for ${platform}`,
            });
          }

          if (!url.match(/^https?:\/\/.+/)) {
            return res.status(400).json({
              success: false,
              message: `Invalid URL format for ${platform}`,
            });
          }

          if (isNaN(Number(impressions)) || Number(impressions) < 0) {
            return res.status(400).json({
              success: false,
              message: `Invalid impressions count for ${platform}`,
            });
          }

          influencerData[platform] = {
            followers,
            url,
            impressions,
          };

          const proofFile =
            filesMap[`${platform}[proof]`] || // Frontend sends this format first
            filesMap[`${platform}.proof`] ||
            filesMap[`${platform}Proof`] ||
            filesMap[`${platform}_proof`] ||
            filesMap[platform] ||
            filesMap[`proof_${platform}`];

          if (proofFile) {
            const uploadPromise = new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: `influencer-proofs/${platform}`,
                  resource_type: "auto",
                },
                (error, result) => {
                  if (error) {
                    console.log(`[v0] ${platform} upload error:`, error);
                    reject(error);
                  } else {
                    console.log(
                      `[v0] ${platform} upload success:`,
                      result?.secure_url
                    );
                    influencerData[platform].proofUrl = result?.secure_url;
                    resolve(result);
                  }
                }
              );
              uploadStream.end(proofFile.buffer);
            });
            uploadPromises.push(uploadPromise);
          } else {
            return res.status(400).json({
              success: false,
              message: `Proof file is required for ${platform}`,
            });
          }
        }
      }
    }

    // Handle audience proof file
    const audienceProofFile =
      filesMap.audienceProof ||
      filesMap.audience_proof ||
      filesMap["audience.proof"] ||
      filesMap.audienceproof;

    if (audienceProofFile) {
      const audienceUploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "influencer-proofs/audience",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              influencerData.audienceProofUrl = result?.secure_url;
              resolve(result);
            }
          }
        );
        uploadStream.end(audienceProofFile.buffer);
      });
      uploadPromises.push(audienceUploadPromise);
    }

    try {
      await Promise.all(uploadPromises);
    } catch (uploadError) {
      console.error("File upload error:", uploadError);
      return res.status(500).json({
        success: false,
        error: "Failed to upload files",
      });
    }

    const influencer = new Influencer(influencerData);
    await influencer.save();

    try {
      await sendInfluencerWelcomeEmail(influencer, plainPassword);
      influencer.emailSent = true;
      await influencer.save();
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    try {
      await sendAdminNotificationEmail(influencer);
    } catch (adminEmailError) {
      console.error("Failed to send admin notification:", adminEmailError);
    }

    const { password, ...influencerResponseData } = influencer.toObject();

    res.status(201).json({
      success: true,
      message: "Influencer registration successful",
      data: {
        id: influencer._id,
        name: influencer.name,
        email: influencer.email,
        status: influencer.status,
      },
    });
  } catch (error: any) {
    console.error("Influencer registration error:", error);

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
        message: "An influencer with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error occurred",
    });
  }
};

export const getInfluencers = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.query.page as string) || 1;
    const limit = Number.parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const filter: any = {};

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const totalCount = await Influencer.countDocuments(filter);
    const influencers = await Influencer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-password"); // Exclude password from results

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        influencers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit,
        },
      },
    });
  } catch (error: any) {
    console.error("Get influencers error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error occurred",
    });
  }
};

export const getInfluencerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid influencer ID format",
      });
    }

    const influencer = await Influencer.findById(id).select("-password");

    if (!influencer) {
      return res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
    }

    res.json({
      success: true,
      data: { influencer },
    });
  } catch (error: any) {
    console.error("Get influencer by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error occurred",
    });
  }
};

export const updateInfluencerStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid influencer ID format",
      });
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: pending, approved, or rejected",
      });
    }

    const influencer = await Influencer.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password");

    if (!influencer) {
      return res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
    }

    res.json({
      success: true,
      message: "Influencer status updated successfully",
      data: { influencer },
    });
  } catch (error: any) {
    console.error("Update influencer status error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error occurred",
    });
  }
};

// Delete influencer
export const deleteInfluencer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid influencer ID format",
      });
    }

    const influencer = await Influencer.findById(id);

    if (!influencer) {
      return res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
    }

    // Clean up uploaded files from Cloudinary before deletion
    const filesToDelete: string[] = [];

    // Collect all proof URLs
    const platforms = ["instagram", "twitter", "tiktok", "youtube"];
    platforms.forEach((platform) => {
      const platformData = (influencer as any)[platform];
      if (platformData?.proofUrl) {
        filesToDelete.push(platformData.proofUrl);
      }
    });

    if (influencer.audienceProofUrl) {
      filesToDelete.push(influencer.audienceProofUrl);
    }

    // Delete files from Cloudinary
    const deletePromises = filesToDelete.map(async (url) => {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = url.split("/");
        const fileWithExt = urlParts[urlParts.length - 1];
        const publicId = urlParts
          .slice(-3)
          .join("/")
          .replace(/\.[^/.]+$/, "");

        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted file from Cloudinary: ${publicId}`);
      } catch (error) {
        console.error(`Failed to delete file from Cloudinary: ${url}`, error);
        // Continue deletion even if file cleanup fails
      }
    });

    // Execute file deletions (don't wait for completion to avoid blocking)
    Promise.all(deletePromises).catch((error) => {
      console.error("Some files could not be deleted from Cloudinary:", error);
    });

    // Delete influencer from database
    await Influencer.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Influencer deleted successfully",
      data: {
        deletedInfluencer: {
          id: influencer._id,
          name: influencer.name,
          email: influencer.email,
          status: influencer.status,
        },
      },
    });
  } catch (error: any) {
    console.error("Delete influencer error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete influencer",
    });
  }
};

// Update influencer details
export const updateInfluencer = async (
  req: InfluencerRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid influencer ID format",
      });
    }

    // Check if influencer exists
    const existingInfluencer = await Influencer.findById(id);
    if (!existingInfluencer) {
      return res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
    }

    // Handle file uploads if present
    const filesMap: { [key: string]: Express.Multer.File } = {};
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file: Express.Multer.File) => {
        filesMap[file.fieldname] = file;
      });
    }

    // Parse JSON strings from FormData
    const parsedBody = { ...req.body };
    Object.keys(parsedBody).forEach((key) => {
      if (typeof parsedBody[key] === "string") {
        try {
          const parsed = JSON.parse(parsedBody[key]);
          if (typeof parsed === "object") {
            parsedBody[key] = parsed;
          }
        } catch (e) {
          // Not JSON, keep as string
        }
      }
    });

    // Fields that can be updated
    const allowedUpdates = [
      "name",
      "phone",
      "whatsapp",
      "location",
      "niches",
      "audienceLocation",
      "malePercentage",
      "femalePercentage",
      "followerFee",
      "impressionFee",
      "locationFee",
      "nicheFee",
      "earningsPerPost",
      "earningsPerPostNaira",
      "maxMonthlyEarnings",
      "maxMonthlyEarningsNaira",
      "followersCount",
    ];

    // Build update object with only allowed fields
    const updates: any = {};
    Object.keys(parsedBody).forEach((key) => {
      if (allowedUpdates.includes(key) && parsedBody[key] !== undefined) {
        updates[key] = parsedBody[key];
      }
    });

    // Validate email format if email is being updated (but don't allow email updates for security)
    if (parsedBody.email && parsedBody.email !== existingInfluencer.email) {
      return res.status(400).json({
        success: false,
        error: "Email cannot be updated. Create a new account if needed.",
      });
    }

    // Validate niches if provided
    if (updates.niches) {
      const parsedNiches =
        typeof updates.niches === "string"
          ? JSON.parse(updates.niches)
          : updates.niches;
      if (!Array.isArray(parsedNiches) || parsedNiches.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one niche must be selected",
        });
      }
      updates.niches = parsedNiches;
    }

    const uploadPromises: Promise<any>[] = [];
    const platforms = ["instagram", "twitter", "tiktok", "youtube"];

    // Handle platform updates
    for (const platform of platforms) {
      const platformData = parsedBody[platform];

      if (platformData && typeof platformData === "object") {
        const { followers, url, impressions } = platformData;

        // Validate platform data if all fields are provided
        if (
          followers !== undefined &&
          url !== undefined &&
          impressions !== undefined
        ) {
          if (isNaN(Number(followers)) || Number(followers) < 0) {
            return res.status(400).json({
              success: false,
              error: `Invalid followers count for ${platform}`,
            });
          }

          if (!url.match(/^https?:\/\/.+/)) {
            return res.status(400).json({
              success: false,
              error: `Invalid URL format for ${platform}`,
            });
          }

          if (isNaN(Number(impressions)) || Number(impressions) < 0) {
            return res.status(400).json({
              success: false,
              error: `Invalid impressions count for ${platform}`,
            });
          }

          // Update platform data
          const existingPlatformData = (existingInfluencer as any)[platform];
          updates[platform] = {
            ...(existingPlatformData?.toObject
              ? existingPlatformData.toObject()
              : existingPlatformData || {}),
            followers,
            url,
            impressions,
          };

          // Handle new proof file upload
          const proofFile =
            filesMap[`${platform}[proof]`] ||
            filesMap[`${platform}.proof`] ||
            filesMap[`${platform}Proof`] ||
            filesMap[`${platform}_proof`] ||
            filesMap[platform] ||
            filesMap[`proof_${platform}`];

          if (proofFile) {
            const uploadPromise = new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: `influencer-proofs/${platform}`,
                  resource_type: "auto",
                },
                async (error, result) => {
                  if (error) {
                    console.log(`${platform} upload error:`, error);
                    reject(error);
                  } else {
                    console.log(
                      `${platform} upload success:`,
                      result?.secure_url
                    );

                    // Delete old proof file if it exists
                    const existingPlatformData = (existingInfluencer as any)[
                      platform
                    ];
                    if (existingPlatformData?.proofUrl) {
                      try {
                        const oldUrl = existingPlatformData.proofUrl;
                        const urlParts = oldUrl.split("/");
                        const publicId = urlParts
                          .slice(-3)
                          .join("/")
                          .replace(/\.[^/.]+$/, "");
                        await cloudinary.uploader.destroy(publicId);
                        console.log(`Deleted old ${platform} proof file`);
                      } catch (deleteError) {
                        console.error(
                          `Failed to delete old ${platform} proof file:`,
                          deleteError
                        );
                      }
                    }

                    updates[platform].proofUrl = result?.secure_url;
                    resolve(result);
                  }
                }
              );
              uploadStream.end(proofFile.buffer);
            });
            uploadPromises.push(uploadPromise);
          }
        }
      }
    }

    // Handle audience proof file update
    const audienceProofFile =
      filesMap.audienceProof ||
      filesMap.audience_proof ||
      filesMap["audience.proof"] ||
      filesMap.audienceproof;

    if (audienceProofFile) {
      const audienceUploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "influencer-proofs/audience",
            resource_type: "auto",
          },
          async (error, result) => {
            if (error) {
              console.log("Audience upload error:", error);
              reject(error);
            } else {
              console.log("Audience upload success:", result?.secure_url);

              // Delete old audience proof file if it exists
              if (existingInfluencer.audienceProofUrl) {
                try {
                  const oldUrl = existingInfluencer.audienceProofUrl;
                  const urlParts = oldUrl.split("/");
                  const publicId = urlParts
                    .slice(-3)
                    .join("/")
                    .replace(/\.[^/.]+$/, "");
                  await cloudinary.uploader.destroy(publicId);
                  console.log("Deleted old audience proof file");
                } catch (deleteError) {
                  console.error(
                    "Failed to delete old audience proof file:",
                    deleteError
                  );
                }
              }

              updates.audienceProofUrl = result?.secure_url;
              resolve(result);
            }
          }
        );
        uploadStream.end(audienceProofFile.buffer);
      });
      uploadPromises.push(audienceUploadPromise);
    }

    // Wait for all file uploads to complete
    if (uploadPromises.length > 0) {
      try {
        console.log(
          `Starting ${uploadPromises.length} file uploads for update`
        );
        await Promise.all(uploadPromises);
        console.log("All file uploads completed successfully");
      } catch (uploadError) {
        console.error("File upload error during update:", uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload files",
        });
      }
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    // Update influencer in database
    const updatedInfluencer = await Influencer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedInfluencer) {
      return res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Influencer updated successfully",
      data: { influencer: updatedInfluencer },
    });
  } catch (error: any) {
    console.error("Update influencer error:", error);

    // Handle specific MongoDB errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: Object.values(error.errors).map((err: any) => err.message),
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update influencer",
    });
  }
};

// Get influencer statistics/dashboard data
export const getInfluencerStats = async (req: Request, res: Response) => {
  try {
    const totalInfluencers = await Influencer.countDocuments();
    const pendingInfluencers = await Influencer.countDocuments({
      status: "pending",
    });
    const approvedInfluencers = await Influencer.countDocuments({
      status: "approved",
    });
    const rejectedInfluencers = await Influencer.countDocuments({
      status: "rejected",
    });

    // Recent registrations (last 30 days)
    const recentInfluencers = await Influencer.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    // Platform distribution
    const platformStats = await Influencer.aggregate([
      {
        $project: {
          platforms: {
            $filter: {
              input: [
                {
                  $cond: [
                    { $ifNull: ["$instagram.followers", false] },
                    "Instagram",
                    null,
                  ],
                },
                {
                  $cond: [
                    { $ifNull: ["$twitter.followers", false] },
                    "Twitter",
                    null,
                  ],
                },
                {
                  $cond: [
                    { $ifNull: ["$tiktok.followers", false] },
                    "TikTok",
                    null,
                  ],
                },
                {
                  $cond: [
                    { $ifNull: ["$youtube.followers", false] },
                    "YouTube",
                    null,
                  ],
                },
              ],
              as: "platform",
              cond: { $ne: ["$$platform", null] },
            },
          },
        },
      },
      { $unwind: "$platforms" },
      { $group: { _id: "$platforms", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Top locations (top 10)
    const locationStats = await Influencer.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Top niches
    const nicheStats = await Influencer.aggregate([
      { $unwind: "$niches" },
      { $group: { _id: "$niches", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Average earnings data (only for approved influencers)
    const earningsStats = await Influencer.aggregate([
      {
        $match: {
          status: "approved",
          earningsPerPost: { $exists: true, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          avgEarningsPerPost: { $avg: "$earningsPerPost" },
          maxEarningsPerPost: { $max: "$earningsPerPost" },
          minEarningsPerPost: { $min: "$earningsPerPost" },
          avgMaxMonthlyEarnings: { $avg: "$maxMonthlyEarnings" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalInfluencers,
          pendingInfluencers,
          approvedInfluencers,
          rejectedInfluencers,
          recentInfluencers,
        },
        platformDistribution: platformStats,
        topLocations: locationStats,
        topNiches: nicheStats,
        earningsOverview: earningsStats[0] || {
          avgEarningsPerPost: 0,
          maxEarningsPerPost: 0,
          minEarningsPerPost: 0,
          avgMaxMonthlyEarnings: 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Get influencer stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve influencer statistics",
    });
  }
};

// Bulk update influencer status
export const bulkUpdateInfluencerStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { influencerIds, status } = req.body;

    // Validate status
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: pending, approved, or rejected",
      });
    }

    // Validate influencer IDs
    if (!Array.isArray(influencerIds) || influencerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "influencerIds must be a non-empty array",
      });
    }

    // Validate all IDs are valid MongoDB ObjectIds
    const invalidIds = influencerIds.filter(
      (id) => !id.match(/^[0-9a-fA-F]{24}$/)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid influencer ID format: ${invalidIds.join(", ")}`,
      });
    }

    // Update multiple influencers
    const result = await Influencer.updateMany(
      { _id: { $in: influencerIds } },
      { status, updatedAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} influencer(s) status to ${status}`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        updatedStatus: status,
      },
    });
  } catch (error: any) {
    console.error("Bulk update influencer status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update influencer statuses",
    });
  }
};
