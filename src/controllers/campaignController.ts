// This controller houses the API endpoints for the campigns associated with brands

import { Request, Response } from "express";
import Campaign from "../models/Campaign";
import Brand from "../models/Brand";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  sendCampaignEmails,
  sendCampaignStatusEmail,
  sendCampaignUpdateEmails,
} from "../services/emailService";
import {
  sendPaymentConfirmationEmail,
  sendInfluencersAssignedEmail,
  sendInfluencerAssignmentEmail,
} from "../services/campaignEmailServices";
import Influencer from "../models/Influencer";
import nodemailer from "nodemailer";
import {
  sendCampaignAssignmentWhatsApp,
  sendCampaignResponseWhatsApp,
} from "../services/whatsAppService";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    [key: string]: any;
  };
}

// Helper function to convert Mongoose document to plain object
const convertCampaignForEmail = (campaignDoc: any) => {
  const campaign = campaignDoc.toObject ? campaignDoc.toObject() : campaignDoc;
  return {
    ...campaign,
    _id: campaign._id.toString(),
  };
};

// nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

// Create a new campaign
export const createCampaign = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
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

    let userEmail = authenticatedUser.email || authenticatedUser.user?.email;

    if (!userEmail) {
      try {
        const User = require("../models/User");
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

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one platform must be selected",
      });
    }

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

    // Prepare the campaign data
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

    const campaign = new Campaign(campaignData);
    const savedCampaign = await campaign.save();

    try {
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

        return res.status(500).json({
          success: false,
          message:
            "Database configuration issue: Email unique constraint should be removed. Please contact system administrator.",
          error: "DUPLICATE_EMAIL_CONSTRAINT",
          suggestion:
            "Remove unique constraint on email field in Campaign model",
        });
      }

      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: `Duplicate value for field: ${duplicateField}`,
        duplicateField,
      });
    }

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

// Get campaigns by user (for authenticated users only)
export const getUserCampaigns = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    // Validate influencer range
    if (req.body.influencersMin && req.body.influencersMax) {
      if (Number(req.body.influencersMin) > Number(req.body.influencersMax)) {
        return res.status(400).json({
          success: false,
          message: "Minimum influencers cannot be greater than maximum",
        });
      }
    }

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

    // Get the old campaign data before updating
    const oldCampaign = await Campaign.findById(id);

    if (!oldCampaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Track which fields are being updated
    const updatedFields: string[] = [];
    const fieldsToTrack = [
      "brandName",
      "email",
      "brandPhone",
      "role",
      "platforms",
      "location",
      "additionalLocations",
      "influencersMin",
      "influencersMax",
      "followersRange",
      "postFrequency",
      "postDuration",
      "avgInfluencers",
      "postCount",
      "costPerInfluencerPerPost",
      "totalBaseCost",
      "platformFee",
      "totalCost",
    ];

    fieldsToTrack.forEach((field) => {
      if (req.body[field] !== undefined) {
        const oldValue = (oldCampaign as any)[field];
        const newValue = req.body[field];

        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          updatedFields.push(field);
        }
      }
    });

    const updateObject = {
      ...req.body,
      status: "pending",
    };

    const campaign = await Campaign.findByIdAndUpdate(id, updateObject, {
      new: true,
      runValidators: true,
    });

    // Send status change email if status was explicitly changed
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
      }
    }

    // Send update notification emails if there were actual changes
    // (and it's not just a status change from admin)
    if (updatedFields.length > 0 && !req.body.status) {
      try {
        await sendCampaignUpdateEmails({
          brandName: campaign?.brandName || oldCampaign.brandName,
          email: campaign?.email || oldCampaign.email,
          campaignId: id,
          oldData: oldCampaign.toObject(),
          newData: campaign?.toObject() || {},
          updatedFields,
        });

        console.log(
          `✅ Update notification emails sent for ${updatedFields.length} changes`
        );
      } catch (emailError) {
        console.error("Failed to send campaign update emails:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      data: campaign,
      message:
        updatedFields.length > 0
          ? `Campaign updated successfully. ${updatedFields.length} field(s) changed.`
          : "Campaign updated successfully.",
    });
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format",
      });
    }

    if (!Array.isArray(influencerIds) || influencerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Influencer IDs must be a non-empty array",
      });
    }

    for (const influencerId of influencerIds) {
      if (!mongoose.Types.ObjectId.isValid(influencerId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid influencer ID format: ${influencerId}`,
        });
      }
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const uniqueInfluencerIds = [...new Set(influencerIds)];

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

    const totalAfterAssignment =
      campaign.assignedInfluencers.length + newInfluencerIds.length;

    // Check against campaign limits
    if (totalAfterAssignment > campaign.influencersMax) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign more influencers. Campaign limit is ${campaign.influencersMax}, currently ${campaign.assignedInfluencers.length} assigned`,
      });
    }

    const newInfluencers = await Influencer.find({
      _id: { $in: newInfluencerIds },
    }).select("name email whatsapp location phone");

    if (newInfluencers.length !== newInfluencerIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some influencer IDs do not exist",
      });
    }

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
        ...(campaign.assignedInfluencers.length === 0 && {
          status: "approved",
        }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCampaign) {
      return res.status(500).json({
        success: false,
        message: "Failed to update campaign",
      });
    }

    // Send email notifications
    try {
      const emailPromises = newInfluencers.map(async (influencer) => {
        try {
          const campaignForEmail = convertCampaignForEmail(updatedCampaign);

          const emailData = sendInfluencerAssignmentEmail(
            influencer.email,
            influencer.name,
            campaignForEmail
          );

          await transporter.sendMail({
            from: `"CaringSparks Team" <${process.env.EMAIL_USER}>`,
            ...emailData,
          });
        } catch (error) {
          console.error(
            `Failed to send assignment email to ${influencer.email}:`,
            error
          );
          throw error;
        }
      });

      await Promise.allSettled(emailPromises);
    } catch (emailError) {
      console.error("Failed to send influencer assignment emails:", emailError);
    }

    // Send WhatsApp notifications
    try {
      const whatsappPromises = newInfluencers.map(async (influencer) => {
        // Only send WhatsApp if whatsapp field exists
        if (!influencer.whatsapp) {
          console.log(`No WhatsApp number for influencer ${influencer.name}`);
          return { success: false, reason: "no_whatsapp" };
        }

        try {
          const result = await sendCampaignAssignmentWhatsApp(
            influencer.whatsapp,
            influencer.name,
            updatedCampaign
          );

          if (!result.success) {
            console.error(
              `Failed to send WhatsApp to ${influencer.name} (${influencer.whatsapp}):`,
              result.error
            );
          }

          return result;
        } catch (error) {
          console.error(`WhatsApp error for ${influencer.name}:`, error);
          return { success: false, error: (error as Error).message };
        }
      });

      const whatsappResults = await Promise.allSettled(whatsappPromises);

      const successfulWhatsApp = whatsappResults.filter(
        (result) => result.status === "fulfilled" && result.value.success
      ).length;

      console.log(
        `WhatsApp notifications sent: ${successfulWhatsApp}/${newInfluencers.length}`
      );
    } catch (whatsappError) {
      console.error("Failed to send WhatsApp notifications:", whatsappError);
    }

    // Check if minimum requirement has been met
    const totalAssigned = updatedCampaign.assignedInfluencers.length;
    if (totalAssigned < campaign.influencersMin) {
      console.log(
        `Campaign still needs ${
          campaign.influencersMin - totalAssigned
        } more influencers`
      );
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

// get campaigns assigned to an influencer
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
      "assignedInfluencers.influencerId": influencerId,
    };

    if (status) filter.status = status;
    if (campaignType) filter.campaignType = campaignType;
    if (platform) {
      filter.platforms = {
        $in: Array.isArray(platform) ? platform : [platform],
      };
    }

    if (dateRange) {
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

// respond to the assigned campaigns
export const respondToCampaignAssignment = async (
  req: Request,
  res: Response
) => {
  try {
    const { campaignId } = req.params;
    const { status, message } = req.body;

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

    const influencer = await Influencer.findById(influencerId).select("name");
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found.",
      });
    }

    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
        "assignedInfluencers.acceptanceStatus": "pending",
      },
      {
        $set: {
          "assignedInfluencers.$.acceptanceStatus": status,
          "assignedInfluencers.$.respondedAt": new Date(),
          ...(message && { "assignedInfluencers.$.responseMessage": message }),
        },
      },
      { new: true, runValidators: true }
    ).populate("userId", "brandName brandPhone");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message:
          "Campaign assignment not found, already responded to, or you're not assigned to this campaign.",
      });
    }

    // Send notifications based on response
    try {
      const brand = campaign.userId as any;

      if (!brand) {
        console.error("Brand not found for campaign");
        return;
      }

      if (status === "accepted") {
        if (brand.brandPhone) {
          const whatsappResult = await sendCampaignResponseWhatsApp(
            brand.brandPhone,
            brand.brandName || "Brand",
            influencer.name,
            campaign.brandName,
            "accepted",
            message
          );
        } else {
          console.log("Brand has no phone number");
        }
      } else {
        if (brand.brandPhone) {
          const whatsappResult = await sendCampaignResponseWhatsApp(
            brand.brandPhone,
            brand.brandName || "Brand",
            influencer.name,
            campaign.brandName,
            "declined",
            message
          );
        } else {
          console.log("Brand has no phone number");
        }
      }
    } catch (notificationError) {
      console.error("Failed to send notification:", notificationError);
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
      ...(process.env.NODE_ENV === "development" && { error: err.message }),
    });
  }
};
