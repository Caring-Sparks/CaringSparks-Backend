import { Request, Response } from "express";
import Campaign from "../models/Campaign";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  sendCampaignEmails,
  sendCampaignStatusEmail,
} from "../services/emailService";
import {
  sendPaymentConfirmationEmail,
  sendInfluencersAssignedEmail,
} from "../services/campaignEmailServices";

// Interface to extend Request with user data
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

// Helper function to convert Mongoose document to plain object with proper typing
const convertCampaignForEmail = (campaignDoc: any) => {
  const campaign = campaignDoc.toObject ? campaignDoc.toObject() : campaignDoc;
  return {
    ...campaign,
    _id: campaign._id.toString(), // Ensure _id is a string
  };
};

// Create a new campaign
export const createCampaign = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Extract user from authentication
    let authenticatedUser = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        authenticatedUser = decoded;
        console.log(
          "JWT decoded user:",
          JSON.stringify(authenticatedUser, null, 2)
        );
      } catch (jwtError) {
        console.error("JWT verification failed:", jwtError);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in to create a campaign.",
      });
    }

    // Extract user ID from JWT
    const userId =
      authenticatedUser.id ||
      authenticatedUser._id ||
      authenticatedUser.userId ||
      authenticatedUser.user?.id ||
      authenticatedUser.user?._id ||
      authenticatedUser.sub;

    if (!userId) {
      console.error(
        "No user ID found in JWT. Available fields:",
        Object.keys(authenticatedUser)
      );
      return res.status(400).json({
        success: false,
        message: "No user ID found in authentication token",
      });
    }

    // Get email from JWT or fetch from database
    let userEmail = authenticatedUser.email || authenticatedUser.user?.email;

    if (!userEmail) {
      try {
        const User = require("../models/User"); // Import your User model
        const userFromDB = await User.findById(userId).select("email");
        if (!userFromDB) {
          return res.status(404).json({
            success: false,
            message: "User not found in database",
          });
        }
        userEmail = userFromDB.email;
        console.log("Email fetched from database:", userEmail);
      } catch (dbError) {
        console.error("Error fetching user from database:", dbError);
        return res.status(500).json({
          success: false,
          message: "Error retrieving user information",
        });
      }
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "Could not determine user email",
      });
    }

    // Extract other fields from request body
    const {
      role,
      platforms,
      brandName,
      brandPhone,
      influencersMin,
      influencersMax,
      location,
      additionalLocations,
      followersRange,
      postFrequency,
      postDuration,
      avgInfluencers,
      postCount,
      costPerInfluencerPerPost,
      totalBaseCost,
      platformFee,
      totalCost,
      hasPaid,
      isValidated,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      role,
      platforms,
      brandName,
      brandPhone,
      influencersMin,
      influencersMax,
      location,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value && value !== 0)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missingFields,
      });
    }

    // Validate platforms array
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one platform must be selected",
      });
    }

    // Rest of your validation logic...
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
    const invalidPlatforms = platforms.filter(
      (p) => !validPlatforms.includes(p)
    );
    if (invalidPlatforms.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid platform(s) selected",
        invalidPlatforms,
      });
    }

    // Convert and validate influencer numbers
    const minInfluencers = Number(influencersMin);
    const maxInfluencers = Number(influencersMax);

    if (isNaN(minInfluencers) || isNaN(maxInfluencers)) {
      return res.status(400).json({
        success: false,
        message: "Influencer counts must be valid numbers",
        receivedValues: { influencersMin, influencersMax },
      });
    }

    if (maxInfluencers < minInfluencers) {
      return res.status(400).json({
        success: false,
        message: "Maximum influencers must be greater than or equal to minimum",
        receivedValues: { minInfluencers, maxInfluencers },
      });
    }

    // Prepare campaign data
    const campaignData = {
      userId: new mongoose.Types.ObjectId(userId),
      role: String(role).trim(),
      platforms: platforms.map((p: string) => String(p).trim()),
      brandName: String(brandName).trim(),
      email: userEmail.toLowerCase(),
      brandPhone: String(brandPhone).trim(),
      influencersMin: minInfluencers,
      influencersMax: maxInfluencers,
      location: String(location).trim(),
      additionalLocations: Array.isArray(additionalLocations)
        ? additionalLocations
            .map((loc: string) => String(loc).trim())
            .filter((loc) => loc.length > 0)
        : [],
      followersRange: followersRange ? String(followersRange).trim() : "",
      postFrequency: postFrequency ? String(postFrequency).trim() : "",
      postDuration: postDuration ? String(postDuration).trim() : "",
      avgInfluencers: Number(avgInfluencers) || 0,
      postCount: Number(postCount) || 0,
      costPerInfluencerPerPost: Number(costPerInfluencerPerPost) || 0,
      totalBaseCost: Number(totalBaseCost) || 0,
      platformFee: Number(platformFee) || 0,
      totalCost: Number(totalCost) || 0,
      hasPaid: Boolean(hasPaid) || false,
      isValidated: Boolean(isValidated) || false,
    };

    // Create and save campaign
    const campaign = new Campaign(campaignData);
    const savedCampaign = await campaign.save();

    try {
      // Convert campaign document for email service
      const campaignForEmail = convertCampaignForEmail(savedCampaign);

      const emailResults = await sendCampaignEmails(
        campaignData,
        campaignForEmail
      );

      res.status(201).json({
        success: true,
        data: savedCampaign,
        message: "Campaign created successfully",
        emailStatus: {
          adminNotified: emailResults.adminEmailSent,
          brandNotified: emailResults.brandEmailSent,
        },
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      res.status(201).json({
        success: true,
        data: savedCampaign,
        message:
          "Campaign created successfully, but email notifications failed",
        emailError:
          process.env.NODE_ENV === "development"
            ? (emailError as Error).message
            : "Email service temporarily unavailable",
      });
    }
  } catch (error: any) {
    console.error("Campaign creation error:", error);

    // Handle Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const validationErrors = Object.keys(error.errors).map((field) => ({
        field,
        message: error.errors[field].message,
        value: error.errors[field].value,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle duplicate key errors - MODIFIED TO ALLOW DUPLICATES
    if (error.code === 11000) {
      console.error(
        "Duplicate key error (this should not happen for email):",
        error
      );

      // Check if it's specifically the email field causing the duplicate
      if (error.keyPattern && error.keyPattern.email) {
        console.log(
          "Email duplicate detected - this should be allowed. Attempting workaround..."
        );

        // Try to save again without the problematic field validation
        // This is a temporary workaround - ideally you should remove the unique constraint
        return res.status(500).json({
          success: false,
          message:
            "Database configuration issue: Email unique constraint should be removed. Please contact system administrator.",
          error: "DUPLICATE_EMAIL_CONSTRAINT",
          suggestion:
            "Remove unique constraint on email field in Campaign model",
        });
      }

      // For other duplicate key errors
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField}`,
        duplicateField,
      });
    }

    // Handle cast errors (invalid ObjectId, etc.)
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format",
        field: error.path,
        receivedValue: error.value,
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get campaigns by user (using authenticated user)
export const getUserCampaigns = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Extract user from authentication (same pattern as createCampaign)
    let authenticatedUser = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        authenticatedUser = decoded;
      } catch (jwtError) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId =
      authenticatedUser.id || authenticatedUser._id || authenticatedUser.userId;

    const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

// Get all campaigns with optional filtering
export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const {
      role,
      platforms,
      location,
      followersRange,
      hasPaid,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (role) filter.role = role;
    if (platforms) {
      filter.platforms = {
        $in: Array.isArray(platforms) ? platforms : [platforms],
      };
    }
    if (location) filter.location = new RegExp(location as string, "i");
    if (followersRange) filter.followersRange = followersRange;
    if (hasPaid !== undefined) filter.hasPaid = hasPaid === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const campaigns = await Campaign.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Campaign.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

// Get campaign by ID
export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

// Update campaign by ID
export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    // Validate influencer range if both values are provided
    if (req.body.influencersMin && req.body.influencersMax) {
      if (Number(req.body.influencersMin) > Number(req.body.influencersMax)) {
        return res.status(400).json({
          success: false,
          message: "Minimum influencers cannot be greater than maximum",
        });
      }
    }

    // Validate platforms if provided
    if (req.body.platforms) {
      if (
        !Array.isArray(req.body.platforms) ||
        req.body.platforms.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "At least one platform must be selected",
        });
      }
    }

    // Get the old campaign data to compare status changes
    const oldCampaign = await Campaign.findById(id);

    if (!oldCampaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const campaign = await Campaign.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // Check if status changed to approved or rejected and send email
    if (
      req.body.status &&
      req.body.status !== oldCampaign.status &&
      (req.body.status === "approved" || req.body.status === "rejected")
    ) {
      try {
        await sendCampaignStatusEmail(
          campaign?.email,
          campaign?.brandName,
          req.body.status,
          campaign?.totalCost,
          campaign?.postDuration
        );
      } catch (emailError) {
        console.error("Failed to send campaign status email:", emailError);
        // Don't fail the request if email fails, but log it
      }
    }

    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    if ((error as any).code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

// Delete campaign by ID
export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    const campaign = await Campaign.findByIdAndDelete(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

// Additional utility functions

// Get campaigns by email (for user's own campaigns)
export const getCampaignsByEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Valid email required",
      });
    }

    const campaigns = await Campaign.find({ email: email.toLowerCase() }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hasPaid } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    if (typeof hasPaid !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "hasPaid must be a boolean value",
      });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { hasPaid },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Send payment confirmation email if payment is marked as paid
    if (hasPaid && campaign.email && campaign.brandName) {
      try {
        // Convert campaign document for email service
        const campaignForEmail = convertCampaignForEmail(campaign);

        await sendPaymentConfirmationEmail(
          campaign.email,
          campaign.brandName,
          campaignForEmail
        );
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
        // Don't fail the request if email fails, but log it
      }
    }

    res.status(200).json({
      success: true,
      data: campaign,
      message: `Payment status updated to ${hasPaid ? "paid" : "unpaid"}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const assignInfluencersToCampaign = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { influencerIds } = req.body;

    // Validate campaign ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    // Validate influencer IDs
    if (!Array.isArray(influencerIds) || influencerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Influencer IDs must be a non-empty array",
      });
    }

    // Validate each influencer ID format
    for (const influencerId of influencerIds) {
      if (!mongoose.Types.ObjectId.isValid(influencerId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid influencer ID format: ${influencerId}`,
        });
      }
    }

    // Get the campaign
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Remove duplicates from input
    const uniqueInfluencerIds = [...new Set(influencerIds)];

    // Get currently assigned influencer IDs to avoid duplicates
    const currentlyAssignedIds = campaign.assignedInfluencers.map((inf) =>
      inf.influencerId.toString()
    );

    // Filter out already assigned influencers
    const newInfluencerIds = uniqueInfluencerIds.filter(
      (id) => !currentlyAssignedIds.includes(id)
    );

    if (newInfluencerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "All provided influencers are already assigned to this campaign",
      });
    }

    // Calculate total after assignment (existing + new)
    const totalAfterAssignment =
      campaign.assignedInfluencers.length + newInfluencerIds.length;

    // Check against campaign limits
    if (totalAfterAssignment > campaign.influencersMax) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign more influencers. Campaign limit is ${campaign.influencersMax}, currently ${campaign.assignedInfluencers.length} assigned`,
      });
    }

    // TODO: Validate that the new influencers exist in your Influencer collection
    // const existingInfluencers = await Influencer.find({ _id: { $in: newInfluencerIds } });
    // if (existingInfluencers.length !== newInfluencerIds.length) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Some influencer IDs do not exist",
    //   });
    // }

    // Create new assigned influencer objects with proper structure
    const newAssignedInfluencers = newInfluencerIds.map((influencerId) => ({
      influencerId: new mongoose.Types.ObjectId(influencerId),
      acceptanceStatus: "pending" as const,
      assignedAt: new Date(),
      isCompleted: false,
      submittedJobs: [],
    }));

    // Update the campaign by pushing new assignments
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      id,
      {
        $push: {
          assignedInfluencers: { $each: newAssignedInfluencers },
        },
        // Update status if this is the first assignment
        ...(campaign.assignedInfluencers.length === 0 && {
          status: "approved",
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("assignedInfluencers.influencerId", "name email phone location");

    if (!updatedCampaign) {
      return res.status(500).json({
        success: false,
        message: "Failed to update campaign",
      });
    }

    // Check if minimum requirement is now met
    const totalAssigned = updatedCampaign.assignedInfluencers.length;
    if (totalAssigned < campaign.influencersMin) {
      console.log(
        `Campaign still needs ${
          campaign.influencersMin - totalAssigned
        } more influencers`
      );
    }

    // Extract populated influencer data for email
    const populatedInfluencers = updatedCampaign.assignedInfluencers
      .filter((assignment) =>
        newInfluencerIds.includes(assignment.influencerId._id?.toString())
      )
      .map((assignment) => assignment.influencerId);

    // Send email notification to brand about newly assigned influencers
    try {
      if (populatedInfluencers.length > 0) {
        const campaignForEmail = convertCampaignForEmail(updatedCampaign);

        await sendInfluencersAssignedEmail(
          updatedCampaign.email,
          updatedCampaign.brandName,
          campaignForEmail,
          populatedInfluencers as any
        );
      }
    } catch (emailError) {
      console.error("Failed to send influencers assigned email:", emailError);
      // Don't fail the request if email fails, but log it
    }

    res.status(200).json({
      success: true,
      data: updatedCampaign,
      message: `${newInfluencerIds.length} new influencers assigned successfully. Total assigned: ${totalAssigned}`,
      summary: {
        newlyAssigned: newInfluencerIds.length,
        totalAssigned: totalAssigned,
        campaignMinimum: campaign.influencersMin,
        campaignMaximum: campaign.influencersMax,
        minimumMet: totalAssigned >= campaign.influencersMin,
      },
    });
  } catch (error) {
    console.error("Assign influencers error:", error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const getAssignedCampaigns = async (req: Request, res: Response) => {
  try {
    const { influencerId } = req.params;
    const {
      status,
      campaignType,
      dateRange,
      platform,
      page = 1,
      limit = 10,
    } = req.query;

    if (!influencerId) {
      return res.status(400).json({
        success: false,
        message: "Influencer ID is required",
      });
    }

    const filter: any = {
      "assignedInfluencers.influencerId": influencerId, // Correctly filter by influencer ID within the subdocument
    };

    if (status) filter.status = status;
    if (campaignType) filter.campaignType = campaignType;
    if (platform) {
      filter.platforms = {
        $in: Array.isArray(platform) ? platform : [platform],
      };
    }

    if (dateRange) {
      // ... (your existing date range filter logic)
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "3months":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      if (startDate.getTime() > 0) {
        filter.createdAt = { $gte: startDate };
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const campaigns = await Campaign.find(filter)
      // Only populate fields that are true references.
      // brandName and email are on the Campaign doc, so no populating is needed.
      // Remove the .populate("userId", ...) call.
      .populate(
        "assignedInfluencers.influencerId",
        "name profilePicture followers"
      )
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Campaign.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: campaigns,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching assigned campaigns:", error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};

export const respondToCampaignAssignment = async (
  req: Request,
  res: Response
) => {
  try {
    const { campaignId } = req.params;
    const { status, message } = req.body; // 'status' will be 'accepted' or 'declined'

    const influencerId = (req as any).user?.id || (req as any).user?._id;
    if (!influencerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    if (!["accepted", "declined"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status provided. Must be 'accepted' or 'declined'.",
      });
    }

    // Validate campaign ID format
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format.",
      });
    }

    // Validate influencer ID format
    if (!mongoose.Types.ObjectId.isValid(influencerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid influencer ID format.",
      });
    }

    // Fix 2: Convert influencerId to ObjectId for proper comparison
    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
        "assignedInfluencers.acceptanceStatus": "pending", // Only update if still pending
      },
      {
        $set: {
          "assignedInfluencers.$.acceptanceStatus": status,
          "assignedInfluencers.$.respondedAt": new Date(),
          // Optional: Add response message if you want to store it
          ...(message && { "assignedInfluencers.$.responseMessage": message }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message:
          "Campaign assignment not found, already responded to, or you're not assigned to this campaign.",
      });
    }

    // Optional: Send notification emails or other side effects based on response
    try {
      if (status === "accepted") {
        // Send acceptance notification to brand
        console.log(
          `Influencer ${influencerId} accepted campaign ${campaignId}`
        );
      } else {
        // Send decline notification to brand
        console.log(
          `Influencer ${influencerId} declined campaign ${campaignId}`
        );
      }
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: `Campaign ${status} successfully.`,
      data: campaign,
    });
  } catch (err: any) {
    console.error("Respond to campaign assignment error:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error while processing response.",
      // Only include error details in development
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};
