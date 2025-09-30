import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Influencer from "../models/Influencer";
import { sendDeliverablesSubmissionWhatsApp } from "../services/whatsAppService";

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    _id?: string;
    [key: string]: any;
  };
}

interface DeliverableSubmission {
  platform: string;
  url: string;
  description: string;
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

// Helper function to extract post count from postFrequency string
const extractPostCount = (postFrequency: any): number => {
  if (!postFrequency) return 1;

  // First try to find explicit "= X posts in total" or "X posts in total"
  const totalMatch = postFrequency.match(
    /(?:=\s*)?(\d+)\s*posts?\s+(?:in\s+)?total/i
  );
  if (totalMatch) {
    return parseInt(totalMatch[1], 10);
  }

  // Try to find "X times per week for Y weeks" pattern
  const weeklyMatch = postFrequency.match(
    /(\d+)\s*times?\s+per\s+week\s+for\s+(\d+)\s+weeks?/i
  );
  if (weeklyMatch) {
    const timesPerWeek = parseInt(weeklyMatch[1], 10);
    const numberOfWeeks = parseInt(weeklyMatch[2], 10);
    return timesPerWeek * numberOfWeeks;
  }

  // Try to find "X posts per week" pattern
  const postsPerWeekMatch = postFrequency.match(/(\d+)\s*posts?\s+per\s+week/i);
  if (postsPerWeekMatch) {
    return parseInt(postsPerWeekMatch[1], 10);
  }

  // Try to find "X posts per day" pattern
  const postsPerDayMatch = postFrequency.match(/(\d+)\s*posts?\s+per\s+day/i);
  if (postsPerDayMatch) {
    return parseInt(postsPerDayMatch[1], 10);
  }

  // Try to find just a number followed by "posts"
  const simplePostMatch = postFrequency.match(/(\d+)\s*posts?/i);
  if (simplePostMatch) {
    return parseInt(simplePostMatch[1], 10);
  }

  console.warn(
    `Could not parse post count from: "${postFrequency}". Defaulting to 1.`
  );
  return 1;
};

export const submitCampaignDeliverables = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { campaignId } = req.params;
    const { deliverables }: { deliverables: DeliverableSubmission[] } =
      req.body;
    const influencerId = req.user?.id || req.user?._id;

    if (!influencerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format.",
      });
    }

    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one deliverable is required.",
      });
    }

    // Validate each deliverable
    for (const [index, deliverable] of deliverables.entries()) {
      if (
        !deliverable.platform ||
        !deliverable.url ||
        !deliverable.description
      ) {
        return res.status(400).json({
          success: false,
          message: `Deliverable ${
            index + 1
          } is missing required fields (platform, url, description).`,
        });
      }

      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(deliverable.url)) {
        return res.status(400).json({
          success: false,
          message: `Invalid URL format in deliverable ${index + 1}.`,
        });
      }
    }

    // Find the campaign and the specific influencer assignment
    const campaign = await Campaign.findOne({
      _id: campaignId,
      "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
        influencerId
      ),
      "assignedInfluencers.acceptanceStatus": "accepted",
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message:
          "Campaign not found, not assigned to you, or you haven't accepted this campaign.",
      });
    }

    // Find the specific influencer assignment
    const influencerAssignment = campaign.assignedInfluencers.find(
      (assignment) => assignment.influencerId.toString() === influencerId
    );

    if (!influencerAssignment) {
      return res.status(404).json({
        success: false,
        message: "You are not assigned to this campaign.",
      });
    }

    if (influencerAssignment.isCompleted) {
      return res.status(400).json({
        success: false,
        message: "You have already completed this campaign.",
      });
    }

    // Extract required post count from campaign
    const requiredPostCount =
      campaign.postCount || extractPostCount(campaign.postFrequency);
    console.log(
      `Campaign requires ${requiredPostCount} posts, submitting ${deliverables.length} deliverables`
    );

    // Check if the number of deliverables matches the required post count
    if (deliverables.length !== requiredPostCount) {
      return res.status(400).json({
        success: false,
        message: `This campaign requires exactly ${requiredPostCount} posts. You have submitted ${deliverables.length} deliverables. Please submit all ${requiredPostCount} deliverables to complete the campaign.`,
        data: {
          requiredPosts: requiredPostCount,
          submittedPosts: deliverables.length,
          remainingPosts: requiredPostCount - deliverables.length,
          allowPartialSubmission: false,
        },
      });
    }

    // Get influencer details
    const influencer = await Influencer.findById(influencerId).select("name");
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found.",
      });
    }

    // Transform deliverables to match the schema structure
    const submittedJobs = deliverables.map((deliverable) => ({
      description: `Platform: ${deliverable.platform}\nDescription: ${
        deliverable.description
      }${
        deliverable.metrics
          ? `\nMetrics: ${JSON.stringify(deliverable.metrics)}`
          : ""
      }\nPost URL: ${deliverable.url}`,
      imageUrl: deliverable.url,
      submittedAt: new Date(),
    }));

    // Mark as complete when all posts are submitted
    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      {
        $set: {
          "assignedInfluencers.$.submittedJobs": submittedJobs,
          "assignedInfluencers.$.isCompleted": true,
          "assignedInfluencers.$.completedAt": new Date(),
        },
      },
      { new: true, runValidators: true }
    ).populate("brandId", "name phone");

    if (!updatedCampaign) {
      return res.status(500).json({
        success: false,
        message: "Failed to update campaign with deliverables.",
      });
    }

    // Send WhatsApp notification to brand
    try {
      const brand = updatedCampaign.userId as any;

      if (brand?.brandPhone) {
        const whatsappResult = await sendDeliverablesSubmissionWhatsApp(
          brand.brandPhone,
          brand.brandName || "Brand",
          influencer.name,
          updatedCampaign.brandName,
          deliverables.length,
          requiredPostCount
        );

        if (!whatsappResult.success) {
          console.error(
            "Failed to send WhatsApp to brand:",
            whatsappResult.error
          );
        } else {
          console.log(
            `WhatsApp notification sent to ${brand.name} for deliverable submission`
          );
        }
      }
    } catch (notificationError) {
      console.error("Failed to send WhatsApp notification:", notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      message: `All ${requiredPostCount} deliverables submitted successfully. Campaign is now marked as complete.`,
      data: {
        campaign: updatedCampaign,
        submittedJobs: submittedJobs.length,
        requiredPosts: requiredPostCount,
        submittedAt: new Date(),
        isCompleted: true,
      },
    });
  } catch (error: any) {
    console.error("Submit deliverables error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while submitting deliverables.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Optional: Endpoint to get deliverable status
export const getDeliverableStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { campaignId } = req.params;
    const influencerId = req.user?.id || req.user?._id;

    if (!influencerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    const campaign = await Campaign.findOne(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      {
        "assignedInfluencers.$": 1,
        brandName: 1,
        platforms: 1,
      }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found or you're not assigned to it.",
      });
    }

    const influencerAssignment = campaign.assignedInfluencers[0];

    res.status(200).json({
      success: true,
      data: {
        campaignName: campaign.brandName,
        platforms: campaign.platforms,
        acceptanceStatus: influencerAssignment.acceptanceStatus,
        isCompleted: influencerAssignment.isCompleted,
        completedAt: influencerAssignment.completedAt,
        submittedJobs: influencerAssignment.submittedJobs,
        assignedAt: influencerAssignment.assignedAt,
        respondedAt: influencerAssignment.respondedAt,
      },
    });
  } catch (error: any) {
    console.error("Get deliverable status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching deliverable status.",
    });
  }
};

// **NEW FUNCTION**: Allow partial submissions and save progress
export const saveDeliverablesDraft = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { campaignId } = req.params;
    const { deliverables }: { deliverables: DeliverableSubmission[] } =
      req.body;
    const influencerId = req.user?.id || req.user?._id;

    if (!influencerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
        influencerId
      ),
      "assignedInfluencers.acceptanceStatus": "accepted",
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found or not assigned to you.",
      });
    }

    const requiredPostCount =
      campaign.postCount || extractPostCount(campaign.postFrequency);
    const submittedJobs = deliverables.map((deliverable) => ({
      description: `Platform: ${deliverable.platform}\nDescription: ${
        deliverable.description
      }${
        deliverable.metrics
          ? `\nMetrics: ${JSON.stringify(deliverable.metrics)}`
          : ""
      }\nPost URL: ${deliverable.url}`,
      imageUrl: deliverable.url,
      submittedAt: new Date(),
    }));

    // **IMPORTANT**: Only mark as complete if all required posts are submitted
    const isCompleted = deliverables.length >= requiredPostCount;

    const updateData: any = {
      "assignedInfluencers.$.submittedJobs": submittedJobs,
      "assignedInfluencers.$.isCompleted": isCompleted,
    };

    if (isCompleted) {
      updateData["assignedInfluencers.$.completedAt"] = new Date();
    }

    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate("assignedInfluencers.influencerId", "name email");

    res.status(200).json({
      success: true,
      message: isCompleted
        ? `All ${requiredPostCount} deliverables submitted. Campaign completed!`
        : `Progress saved: ${deliverables.length}/${requiredPostCount} posts submitted.`,
      data: {
        campaign: updatedCampaign,
        submittedJobs: deliverables.length,
        requiredPosts: requiredPostCount,
        remainingPosts: Math.max(0, requiredPostCount - deliverables.length),
        isCompleted,
        submittedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("Save deliverables draft error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while saving deliverables draft.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

export const updateSubmittedDeliverables = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { campaignId } = req.params;
    const { deliverables }: { deliverables: DeliverableSubmission[] } =
      req.body;
    const influencerId = req.user?.id || req.user?._id;

    if (!influencerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format.",
      });
    }

    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one deliverable is required.",
      });
    }

    // Find campaign and ensure user has completed deliverables
    const campaign = await Campaign.findOne({
      _id: campaignId,
      "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
        influencerId
      ),
      "assignedInfluencers.isCompleted": true, // Only allow updates if already completed
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message:
          "Campaign not found or you haven't completed deliverables yet.",
      });
    }

    // Extract required post count and validate
    const requiredPostCount =
      campaign.postCount || extractPostCount(campaign.postFrequency);

    // **MAINTAIN THE REQUIREMENT**: Still need all posts for updates
    if (deliverables.length !== requiredPostCount) {
      return res.status(400).json({
        success: false,
        message: `This campaign requires exactly ${requiredPostCount} posts. You are trying to update with ${deliverables.length} deliverables.`,
        data: {
          requiredPosts: requiredPostCount,
          submittedPosts: deliverables.length,
        },
      });
    }

    // Transform deliverables
    const submittedJobs = deliverables.map((deliverable) => ({
      description: `Platform: ${deliverable.platform}\nDescription: ${
        deliverable.description
      }${
        deliverable.metrics
          ? `\nMetrics: ${JSON.stringify(deliverable.metrics)}`
          : ""
      }\nPost URL: ${deliverable.url}`,
      imageUrl: deliverable.url,
      submittedAt: new Date(), // Update submission time
    }));

    // Update the submitted jobs
    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      {
        $set: {
          "assignedInfluencers.$.submittedJobs": submittedJobs,
          // Keep isCompleted as true since this is an update of already completed work
          "assignedInfluencers.$.isCompleted": true,
        },
      },
      { new: true, runValidators: true }
    ).populate("assignedInfluencers.influencerId", "name email");

    res.status(200).json({
      success: true,
      message: "Deliverables updated successfully.",
      data: {
        campaign: updatedCampaign,
        updatedJobs: submittedJobs.length,
        requiredPosts: requiredPostCount,
        updatedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("Update deliverables error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating deliverables.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};
