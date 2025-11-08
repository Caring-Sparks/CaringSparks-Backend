import { Request, Response } from "express";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Influencer from "../models/Influencer";
import Brand from "../models/Brand";

export const addReview = async (req: Request, res: Response) => {
  try {
    const { campaignId, jobId } = req.params;
    const { comment, influencerId } = req.body;
    const user = (req as any).user;

    // Validation
    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    if (comment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 1000 characters",
      });
    }

    // Find the campaign
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Find the assigned influencer
    const assignedInfluencer = campaign.assignedInfluencers.find(
      (inf) => inf.influencerId.toString() === influencerId
    );

    if (!assignedInfluencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not assigned to this campaign",
      });
    }

    // Find the submitted job
    const submittedJob = assignedInfluencer.submittedJobs.find(
      (job: any) => job._id?.toString() === jobId
    );

    if (!submittedJob) {
      return res.status(404).json({
        success: false,
        message: "Submitted job not found",
      });
    }

    // Determine author type and details
    let authorType: "brand" | "influencer";
    let authorId: mongoose.Types.ObjectId;
    let authorName: string;

    if (campaign.userId.toString() === user._id.toString()) {
      authorType = "brand";
      authorId = user._id;

      if (campaign.brandName) {
        authorName = campaign.brandName;
      } else {
        authorName = user.brandName || user.name || "Brand";

        if (!user.brandName && !user.name) {
          try {
            const brand = await Brand.findById(user._id).select(
              "brandName name"
            );
            authorName = brand?.brandName || brand?.brandName || "Brand";
          } catch (err) {
            console.warn("Failed to fetch brand name:", err);
            authorName = "Brand";
          }
        }
      }
    } else if (influencerId === user._id.toString()) {
      authorType = "influencer";
      authorId = user._id;

      if (user.name) {
        authorName = user.name;
      } else {
        try {
          const influencer = await Influencer.findById(user._id).select("name");

          if (!influencer || !influencer.name) {
            return res.status(400).json({
              success: false,
              message: "Influencer name not found. Please update your profile.",
            });
          }

          authorName = influencer.name;
        } catch (err) {
          console.error("Failed to fetch influencer name:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to retrieve influencer information",
          });
        }
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to comment on this job",
      });
    }

    // Validate that we have an author name
    if (!authorName || authorName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Author name is required. Please update your profile.",
      });
    }

    // Create new review comment
    const newReview = {
      _id: new mongoose.Types.ObjectId(),
      authorType,
      authorId,
      authorName: authorName.trim(),
      comment: comment.trim(),
      createdAt: new Date(),
    };

    // Add review to the job
    if (!submittedJob.reviews) {
      submittedJob.reviews = [];
    }
    submittedJob.reviews.push(newReview as any);

    // Save the campaign
    await campaign.save();

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      data: {
        review: newReview,
      },
    });
  } catch (error: any) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add review",
      error: error.message,
    });
  }
};

// Get all reviews for a specific job
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { campaignId, jobId } = req.params;
    const { influencerId } = req.query;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const assignedInfluencer = campaign.assignedInfluencers.find(
      (inf) => inf.influencerId.toString() === influencerId
    );

    if (!assignedInfluencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not assigned to this campaign",
      });
    }

    const submittedJob = assignedInfluencer.submittedJobs.find(
      (job: any) => job._id?.toString() === jobId
    );

    if (!submittedJob) {
      return res.status(404).json({
        success: false,
        message: "Submitted job not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reviews: submittedJob.reviews || [],
      },
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

// Update a review (optional)
export const updateReview = async (req: Request, res: Response) => {
  try {
    const { campaignId, jobId, reviewId } = req.params;
    const { comment, influencerId } = req.body;
    const user = (req as any).user;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment is required",
      });
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const assignedInfluencer = campaign.assignedInfluencers.find(
      (inf) => inf.influencerId.toString() === influencerId
    );

    if (!assignedInfluencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not assigned to this campaign",
      });
    }

    const submittedJob = assignedInfluencer.submittedJobs.find(
      (job: any) => job._id?.toString() === jobId
    );

    if (!submittedJob) {
      return res.status(404).json({
        success: false,
        message: "Submitted job not found",
      });
    }

    const review = submittedJob.reviews.find(
      (r) => r._id?.toString() === reviewId
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if user is the author
    if (review.authorId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reviews",
      });
    }

    // Update the review
    review.comment = comment.trim();
    review.updatedAt = new Date();

    await campaign.save();

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: {
        review,
      },
    });
  } catch (error: any) {
    console.error("Error updating review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

// Delete a review (optional)
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { campaignId, jobId, reviewId } = req.params;
    const { influencerId } = req.query;
    const user = (req as any).user;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    const assignedInfluencer = campaign.assignedInfluencers.find(
      (inf) => inf.influencerId.toString() === influencerId
    );

    if (!assignedInfluencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not assigned to this campaign",
      });
    }

    const submittedJob = assignedInfluencer.submittedJobs.find(
      (job: any) => job._id?.toString() === jobId
    );

    if (!submittedJob) {
      return res.status(404).json({
        success: false,
        message: "Submitted job not found",
      });
    }

    const reviewIndex = submittedJob.reviews.findIndex(
      (r) => r._id?.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const review = submittedJob.reviews[reviewIndex];

    // Check if user is the author or campaign owner
    const isAuthor = review.authorId.toString() === user._id.toString();
    const isCampaignOwner = campaign.userId.toString() === user._id.toString();

    if (!isAuthor && !isCampaignOwner) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this review",
      });
    }

    // Remove the review
    submittedJob.reviews.splice(reviewIndex, 1);

    await campaign.save();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};
