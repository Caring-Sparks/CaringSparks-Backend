import type { Request, Response } from "express";
import type { InfluencerRequest } from "../types/multer";
import cloudinary from "../utils/cloudinary";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Influencer from "../models/Influencer";
import {
  sendInfluencerWelcomeEmail,
  sendAdminNotificationEmail,
  sendInfluencerStatusEmail,
} from "../services/influencerEmailService";

export const createInfluencer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const filesMap: { [key: string]: Express.Multer.File } = {};

    // Handle different file upload formats that Multer can provide
    if (req.files) {
      if (Array.isArray(req.files)) {
        // When files are uploaded as an array
        req.files.forEach((file: Express.Multer.File) => {
          filesMap[file.fieldname] = file;
        });
      } else {
        // When files are uploaded as an object with field names
        Object.keys(req.files).forEach((fieldname) => {
          const fileArray = (
            req.files as { [fieldname: string]: Express.Multer.File[] }
          )[fieldname];
          if (fileArray && fileArray.length > 0) {
            filesMap[fieldname] = fileArray[0]; // Take the first file if multiple
          }
        });
      }
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
      res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
      return;
    }

    // Validate niches
    let parsedNiches;
    try {
      parsedNiches = typeof niches === "string" ? JSON.parse(niches) : niches;
    } catch (e) {
      res.status(400).json({
        success: false,
        message: "Invalid niches format",
      });
      return;
    }

    if (!Array.isArray(parsedNiches) || parsedNiches.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one niche must be selected",
      });
      return;
    }

    // Check for existing influencer
    const existingInfluencer = await Influencer.findOne({
      email: email.toLowerCase(),
    });
    if (existingInfluencer) {
      res.status(409).json({
        success: false,
        message: "An influencer with this email already exists",
      });
      return;
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
      malePercentage: Number(malePercentage) || 0,
      femalePercentage: Number(femalePercentage) || 0,
      status: "pending",
      emailSent: false,

      // Add calculated earnings fields from frontend
      followerFee: Number(parsedBody.followerFee) || 0,
      impressionFee: Number(parsedBody.impressionFee) || 0,
      locationFee: Number(parsedBody.locationFee) || 0,
      nicheFee: Number(parsedBody.nicheFee) || 0,
      earningsPerPost: Number(parsedBody.earningsPerPost) || 0,
      earningsPerPostNaira: Number(parsedBody.earningsPerPostNaira) || 0,
      maxMonthlyEarnings: Number(parsedBody.maxMonthlyEarnings) || 0,
      maxMonthlyEarningsNaira: Number(parsedBody.maxMonthlyEarningsNaira) || 0,
      followersCount: Number(parsedBody.followersCount) || 0,
    };

    const platforms = [
      "instagram",
      "twitter",
      "tiktok",
      "youtube",
      "facebook",
      "linkedin",
      "threads",
      "discord",
      "snapchat",
    ];
    const uploadPromises: Promise<any>[] = [];

    for (const platform of platforms) {
      const platformData = parsedBody[platform];

      if (platformData && typeof platformData === "object") {
        const { followers, url, impressions } = platformData;

        if (followers && url && impressions) {
          // Validate platform data
          if (isNaN(Number(followers)) || Number(followers) < 0) {
            res.status(400).json({
              success: false,
              message: `Invalid followers count for ${platform}`,
            });
            return;
          }

          if (!url.match(/^https?:\/\/.+/)) {
            res.status(400).json({
              success: false,
              message: `Invalid URL format for ${platform}`,
            });
            return;
          }

          if (isNaN(Number(impressions)) || Number(impressions) < 0) {
            res.status(400).json({
              success: false,
              message: `Invalid impressions count for ${platform}`,
            });
            return;
          }

          influencerData[platform] = {
            followers: Number(followers),
            url,
            impressions: Number(impressions),
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
                    reject(error);
                  } else {
                    influencerData[platform].proofUrl = result?.secure_url;
                    resolve(result);
                  }
                }
              );
              uploadStream.end(proofFile.buffer);
            });
            uploadPromises.push(uploadPromise);
          } else {
            res.status(400).json({
              success: false,
              message: `Proof file is required for ${platform}`,
            });
            return;
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
      res.status(500).json({
        success: false,
        error: "Failed to upload files",
      });
      return;
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
      res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err: any) => err.message),
      });
      return;
    }

    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: "An influencer with this email already exists",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Internal server error occurred",
    });
  }
};

export const updateInfluencer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        error: "Invalid influencer ID format",
      });
      return;
    }

    // Check if influencer exists
    const existingInfluencer = await Influencer.findById(id);
    if (!existingInfluencer) {
      res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
      return;
    }

    // Handle file uploads if present
    const filesMap: { [key: string]: Express.Multer.File } = {};
    if (req.files) {
      if (Array.isArray(req.files)) {
        req.files.forEach((file: Express.Multer.File) => {
          filesMap[file.fieldname] = file;
        });
      } else {
        Object.keys(req.files).forEach((fieldname) => {
          const fileArray = (
            req.files as { [fieldname: string]: Express.Multer.File[] }
          )[fieldname];
          if (fileArray && fileArray.length > 0) {
            filesMap[fieldname] = fileArray[0];
          }
        });
      }
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
        // Convert numeric fields
        if (
          [
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
          ].includes(key)
        ) {
          updates[key] = Number(parsedBody[key]) || 0;
        } else {
          updates[key] = parsedBody[key];
        }
      }
    });

    // Validate email format if email is being updated (but don't allow email updates for security)
    if (parsedBody.email && parsedBody.email !== existingInfluencer.email) {
      res.status(400).json({
        success: false,
        error: "Email cannot be updated. Create a new account if needed.",
      });
      return;
    }

    // Validate niches if provided
    if (updates.niches) {
      let parsedNiches;
      try {
        parsedNiches =
          typeof updates.niches === "string"
            ? JSON.parse(updates.niches)
            : updates.niches;
      } catch (e) {
        res.status(400).json({
          success: false,
          error: "Invalid niches format",
        });
        return;
      }

      if (!Array.isArray(parsedNiches) || parsedNiches.length === 0) {
        res.status(400).json({
          success: false,
          error: "At least one niche must be selected",
        });
        return;
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
            res.status(400).json({
              success: false,
              error: `Invalid followers count for ${platform}`,
            });
            return;
          }

          if (!url.match(/^https?:\/\/.+/)) {
            res.status(400).json({
              success: false,
              error: `Invalid URL format for ${platform}`,
            });
            return;
          }

          if (isNaN(Number(impressions)) || Number(impressions) < 0) {
            res.status(400).json({
              success: false,
              error: `Invalid impressions count for ${platform}`,
            });
            return;
          }

          // Update platform data
          const existingPlatformData = (existingInfluencer as any)[platform];
          updates[platform] = {
            ...(existingPlatformData?.toObject
              ? existingPlatformData.toObject()
              : existingPlatformData || {}),
            followers: Number(followers),
            url,
            impressions: Number(impressions),
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
        res.status(500).json({
          success: false,
          error: "Failed to upload files",
        });
        return;
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
      res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
      return;
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
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: Object.values(error.errors).map((err: any) => err.message),
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Failed to update influencer",
    });
  }
};

export const getInfluencers = async (
  req: Request,
  res: Response
): Promise<void> => {
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
      .select("-password");

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
      res.status(400).json({
        success: false,
        error: "Invalid influencer ID format",
      });
      return;
    }

    const influencer = await Influencer.findById(id).select("-password");

    if (!influencer) {
      res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
      return;
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
      res.status(400).json({
        success: false,
        error: "Invalid influencer ID format",
      });
      return;
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      res.status(400).json({
        success: false,
        error: "Invalid status. Must be: pending, approved, or rejected",
      });
      return;
    }

    const influencer = await Influencer.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select("-password");

    if (!influencer) {
      res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
      return;
    }

    // Send email notification for approved or rejected status
    if (status === "approved" || status === "rejected") {
      try {
        await sendInfluencerStatusEmail(
          influencer.email,
          influencer.name,
          status
        );
      } catch (emailError) {
        console.error("Failed to send status email:", emailError);
      }
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
      res.status(400).json({
        success: false,
        error: "Invalid influencer ID format",
      });
      return;
    }

    const influencer = await Influencer.findById(id);

    if (!influencer) {
      res.status(404).json({
        success: false,
        error: "Influencer not found",
      });
      return;
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
      res.status(400).json({
        success: false,
        error: "Invalid status. Must be: pending, approved, or rejected",
      });
      return;
    }

    // Validate influencer IDs
    if (!Array.isArray(influencerIds) || influencerIds.length === 0) {
      res.status(400).json({
        success: false,
        error: "influencerIds must be a non-empty array",
      });
      return;
    }

    // Validate all IDs are valid MongoDB ObjectIds
    const invalidIds = influencerIds.filter(
      (id) => !id.match(/^[0-9a-fA-F]{24}$/)
    );
    if (invalidIds.length > 0) {
      res.status(400).json({
        success: false,
        error: `Invalid influencer ID format: ${invalidIds.join(", ")}`,
      });
      return;
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

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    _id?: string;
    [key: string]: any;
  };
}

// Update influencer bank details
export const updateInfluencerBankDetails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { bankDetails } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    // Validate required fields
    if (!bankDetails || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      return res.status(400).json({
        success: false,
        message: "Bank name, account number, and account name are required.",
      });
    }

    // Validate account number format (10 digits for Nigerian banks)
    if (!/^\d{10}$/.test(bankDetails.accountNumber)) {
      return res.status(400).json({
        success: false,
        message: "Account number must be exactly 10 digits.",
      });
    }

    // List of valid Nigerian banks
    const validBanks = [
      "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank",
      "First Bank of Nigeria", "First City Monument Bank", "Guaranty Trust Bank",
      "Heritage Bank", "Keystone Bank", "Polaris Bank", "Providus Bank",
      "Stanbic IBTC Bank", "Standard Chartered Bank", "Sterling Bank",
      "Union Bank of Nigeria", "United Bank for Africa", "Unity Bank",
      "Wema Bank", "Zenith Bank", "Jaiz Bank", "SunTrust Bank",
      "Titan Trust Bank", "VFD Microfinance Bank", "Moniepoint Microfinance Bank",
      "Opay", "Kuda Bank", "Rubies Bank", "GoMoney", "V Bank"
    ];

    if (!validBanks.includes(bankDetails.bankName)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid Nigerian bank.",
      });
    }

    // Update the influencer's bank details
    const updatedInfluencer = await Influencer.findByIdAndUpdate(
      userId,
      {
        $set: {
          bankDetails: {
            bankName: bankDetails.bankName,
            accountNumber: bankDetails.accountNumber,
            accountName: bankDetails.accountName.trim(),
            isVerified: false, // Always set to false initially
          },
          hasBankDetails: true,
        },
      },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires');

    if (!updatedInfluencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bank details updated successfully.",
      data: {
        influencer: updatedInfluencer,
      },
    });

  } catch (error: any) {
    console.error("Update bank details error:", error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while updating bank details.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Get influencer bank details
export const getInfluencerBankDetails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    const influencer = await Influencer.findById(userId)
      .select('bankDetails hasBankDetails')
      .lean();

    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        bankDetails: influencer.bankDetails || null,
        hasBankDetails: influencer.hasBankDetails || false,
      },
    });

  } catch (error: any) {
    console.error("Get bank details error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching bank details.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Admin endpoint to verify bank details
export const verifyInfluencerBankDetails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { influencerId, isVerified } = req.body;

    // Check if user is admin (implement your admin check logic)
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    if (!influencerId || typeof isVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "Influencer ID and verification status are required.",
      });
    }

    const updatedInfluencer = await Influencer.findByIdAndUpdate(
      influencerId,
      {
        $set: {
          'bankDetails.isVerified': isVerified,
        },
      },
      { new: true, runValidators: true }
    ).select('bankDetails hasBankDetails name email');

    if (!updatedInfluencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Bank details ${isVerified ? 'verified' : 'unverified'} successfully.`,
      data: {
        influencer: updatedInfluencer,
      },
    });

  } catch (error: any) {
    console.error("Verify bank details error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while verifying bank details.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};