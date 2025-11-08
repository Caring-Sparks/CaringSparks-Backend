import { Request, Response } from "express";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import Campaign from "../models/Campaign";
import Influencer from "../models/Influencer";
import {
  sendCampaignCompletionWhatsApp,
  sendDeliverablesSubmissionWhatsApp,
} from "../services/whatsAppService";

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
const companyName = "The•PR•God";
const loginUrl = "https://theprgod.com";
const logoUrl = `${loginUrl}/Logo.png`;

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

    const influencerAssignment = campaign.assignedInfluencers.find(
      (assignment) => assignment.influencerId.toString() === influencerId
    );

    if (!influencerAssignment) {
      return res.status(404).json({
        success: false,
        message: "You are not assigned to this campaign.",
      });
    }

    if (influencerAssignment.isCompleted === "Completed") {
      return res.status(400).json({
        success: false,
        message: "You have already completed this campaign.",
      });
    }

    const existingJobsCount = influencerAssignment.submittedJobs?.length || 0;
    const requiredPostCount =
      campaign.postCount || extractPostCount(campaign.postFrequency);

    if (existingJobsCount >= requiredPostCount) {
      return res.status(400).json({
        success: false,
        message: `You have already submitted all ${requiredPostCount} required posts for this campaign. No additional submissions are allowed.`,
      });
    }

    const influencer = await Influencer.findById(influencerId).select("name");
    if (!influencer) {
      return res.status(404).json({
        success: false,
        message: "Influencer not found.",
      });
    }

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

    // Get existing submitted jobs count
    const totalSubmittedCount = existingJobsCount + deliverables.length;

    // Determine completion status based on total submissions
    const isComplete = totalSubmittedCount >= requiredPostCount;
    const completionStatus = isComplete ? "in-progress" : "in-progress";

    // Update operation - append new jobs to existing ones
    const updateOperation: any = {
      $push: {
        "assignedInfluencers.$.submittedJobs": { $each: submittedJobs },
      },
      $set: {
        "assignedInfluencers.$.isCompleted": completionStatus,
      },
    };

    // Only set completedAt if marking as complete
    if (isComplete) {
      updateOperation.$set["assignedInfluencers.$.completedAt"] = new Date();
    }

    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      updateOperation,
      { new: true, runValidators: true }
    ).populate("userId", "name phone");

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
          totalSubmittedCount,
          requiredPostCount
        );

        if (!whatsappResult.success) {
          console.error(
            "Failed to send WhatsApp to brand:",
            whatsappResult.error
          );
        }
      }
    } catch (notificationError) {
      console.error("Failed to send WhatsApp notification:", notificationError);
    }

    // Send email notification to brand
    try {
      const brand = updatedCampaign.userId as any;
      const brandEmail = campaign?.email;

      if (brandEmail) {
        const brandMailOptions = {
          from: `"The•PR•God Team" <${process.env.EMAIL_USER}>`,
          to: brandEmail,
          subject: `New Deliverable${
            deliverables.length > 1 ? "s" : ""
          } Submitted - ${updatedCampaign.brandName} - The•PR•God`,
          html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deliverable Submitted</title>
  <style>
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f1f5f9;
      font-family: 'Source Sans Pro', Arial, sans-serif;
      line-height: 1.6;
      color: #475569;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      width: 100%;
    }
    .header {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background-color: #ffffff;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: #8b5cf6;
    }
    .welcome-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .content {
      padding: 30px 20px;
    }
    .intro-text {
      font-size: 16px;
      color: #475569;
      text-align: center;
      margin-bottom: 25px;
      line-height: 1.7;
    }
    .status-card {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      text-align: center;
    }
    .status-title {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 15px;
      margin-top: 0;
    }
    .status-message {
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
      margin: 0;
    }
    .campaign-details {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .campaign-details h3 {
      color: #374151;
      margin-top: 0;
      font-size: 18px;
      margin-bottom: 15px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #64748b;
    }
    .detail-value {
      color: #374151;
      font-weight: 500;
    }
    .deliverables-section {
      background-color: #f0f9ff;
      border: 1px solid #0ea5e9;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .deliverables-section h4 {
      margin-top: 0;
      color: #0369a1;
      font-size: 16px;
      font-weight: 700;
    }
    .deliverable-item {
      background-color: #ffffff;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 12px;
      border: 1px solid #e0f2fe;
    }
    .deliverable-item:last-child {
      margin-bottom: 0;
    }
    .platform-badge {
      background-color: #3b82f6;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
      margin-bottom: 8px;
    }
    .progress-bar-container {
      background-color: #e5e7eb;
      border-radius: 8px;
      height: 28px;
      margin: 15px 0;
      overflow: hidden;
      position: relative;
    }
    .progress-bar {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: width 0.3s ease;
    }
    .progress-text {
      position: absolute;
      width: 100%;
      text-align: center;
      line-height: 28px;
      font-weight: 700;
      font-size: 13px;
      color: #1f2937;
      z-index: 1;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      margin: 0 10px 10px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 15px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      color: #64748b;
      font-size: 13px;
      margin: 0 0 10px 0;
    }
    .footer-links {
      margin: 10px 0;
    }
    .footer-links a {
      color: #8b5cf6;
      text-decoration: none;
      margin: 0 10px;
      font-size: 13px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-complete {
      background-color: #dcfce7;
      color: #166534;
    }
    .status-progress {
      background-color: #fef3c7;
      color: #92400e;
    }
    .link-button {
      display: inline-block;
      padding: 8px 16px;
      background-color: #3b82f6;
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      margin-top: 8px;
    }
    .metrics-row {
      display: flex;
      gap: 10px;
      margin-top: 8px;
      font-size: 13px;
      flex-wrap: wrap;
    }
    .metric-item {
      background-color: #f1f5f9;
      padding: 4px 8px;
      border-radius: 4px;
    }
    @media only screen and (max-width: 600px) {
      .welcome-title {
        font-size: 22px !important;
      }
      .intro-text {
        font-size: 15px !important;
      }
      .cta-button {
        display: block !important;
        width: calc(100% - 40px) !important;
        margin: 10px 0 !important;
      }
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="${logoUrl}" alt="${companyName} Logo" class="logo" />
      <h1 class="welcome-title">Deliverable${
        deliverables.length > 1 ? "s" : ""
      } Submitted!</h1>
    </div>
    
    <div class="content">
      <p class="intro-text">
        Exciting news, <strong>${
          brand?.brandName || "Brand Partner"
        }</strong>! <strong>${influencer.name}</strong> has just submitted ${
            deliverables.length
          } new deliverable${
            deliverables.length > 1 ? "s" : ""
          } for your campaign <strong>"${updatedCampaign.brandName}"</strong>.
      </p>
      
      <div class="status-card">
        <h2 class="status-title">🎉 New Content Delivered!</h2>
        <div class="status-message">
          ${influencer.name} has completed and submitted ${
            deliverables.length
          } deliverable${
            deliverables.length > 1 ? "s" : ""
          }. Review the content to track your campaign progress and ensure quality standards are met.
        </div>
      </div>
      
      <div class="campaign-details">
        <h3>📊 Campaign Progress</h3>
        <div class="detail-row">
          <span class="detail-label">Campaign Name:</span>
          <span class="detail-value">${updatedCampaign.brandName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Influencer:</span>
          <span class="detail-value">${influencer.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Submitted Now:</span>
          <span class="detail-value">${deliverables.length} post${
            deliverables.length > 1 ? "s" : ""
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Submitted:</span>
          <span class="detail-value">${totalSubmittedCount} of ${requiredPostCount} posts</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Remaining:</span>
          <span class="detail-value">${Math.max(
            0,
            requiredPostCount - totalSubmittedCount
          )} post${
            Math.max(0, requiredPostCount - totalSubmittedCount) !== 1
              ? "s"
              : ""
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="status-badge ${
              totalSubmittedCount >= requiredPostCount
                ? "status-complete"
                : "status-progress"
            }">
              ${
                totalSubmittedCount >= requiredPostCount
                  ? "✅ All Posts Submitted"
                  : "⏳ In Progress"
              }
            </span>
          </span>
        </div>
      </div>

      <div class="progress-bar-container">
        <div class="progress-text">${Math.round(
          (totalSubmittedCount / requiredPostCount) * 100
        )}% Complete</div>
        <div class="progress-bar" style="width: ${
          (totalSubmittedCount / requiredPostCount) * 100
        }%"></div>
      </div>

      <div class="deliverables-section">
        <h4>📦 Submitted Deliverables</h4>
        ${deliverables
          .map(
            (deliverable, index) => `
          <div class="deliverable-item">
            <span class="platform-badge">${deliverable.platform}</span>
            <p style="margin: 8px 0; font-weight: 500; color: #1f2937;">${
              deliverable.description
            }</p>
            ${
              deliverable.metrics
                ? `
              <div class="metrics-row">
                ${
                  deliverable.metrics.views
                    ? `<div class="metric-item">👁️ ${deliverable.metrics.views.toLocaleString()} views</div>`
                    : ""
                }
                ${
                  deliverable.metrics.likes
                    ? `<div class="metric-item">❤️ ${deliverable.metrics.likes.toLocaleString()} likes</div>`
                    : ""
                }
                ${
                  deliverable.metrics.comments
                    ? `<div class="metric-item">💬 ${deliverable.metrics.comments.toLocaleString()} comments</div>`
                    : ""
                }
                ${
                  deliverable.metrics.shares
                    ? `<div class="metric-item">🔄 ${deliverable.metrics.shares.toLocaleString()} shares</div>`
                    : ""
                }
              </div>
            `
                : ""
            }
            <a href="${
              deliverable.url
            }" class="link-button" target="_blank">View Post →</a>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="cta-container">
        <a href="${
          process.env.FRONTEND_URL || "https://theprgod.com"
        }/brands/campaigns/${campaignId}" class="cta-button">Review Deliverables</a>
      </div>

      ${
        totalSubmittedCount >= requiredPostCount
          ? `
        <div style="background-color: #dcfce7; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #166534; font-weight: 500;">
            🎊 <strong>Campaign Complete!</strong> All required posts have been submitted. You can now mark the campaign as complete and process payment.
          </p>
        </div>
      `
          : ""
      }
      
      <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #0369a1; font-size: 14px; font-weight: 500;">
          💡 <strong>Pro Tip:</strong> Review the submitted content and provide feedback if needed. Track all campaign deliverables in your dashboard for real-time updates!
        </p>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        Campaign ID: ${campaignId}<br>
        Submitted: ${new Date().toLocaleString()}
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        This email was sent regarding deliverable submissions on The•PR•God.
      </p>
      
      <div class="footer-links">
        <a href="${
          process.env.FRONTEND_URL || "https://theprgod.com"
        }/brands">Dashboard</a>
        <a href="mailto:support@theprgod.com">Support</a>
        <a href="https://theprgod.com/help">Help Center</a>
        <a href="https://theprgod.com/privacy">Privacy Policy</a>
      </div>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} The•PR•God. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`,
        };

        await transporter.sendMail(brandMailOptions);
      }
    } catch (emailError) {
      console.error("Failed to send email to brand:", emailError);
    }

    // Send email notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@theprgod.com";
      const brand = updatedCampaign.userId as any;

      const adminMailOptions = {
        from: `"The•PR•God System" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `[ADMIN] Deliverable Submitted - ${influencer.name} → ${updatedCampaign.brandName}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin: Deliverable Submitted</title>
  <style>
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #f1f5f9;
      font-family: 'Source Sans Pro', Arial, sans-serif;
      line-height: 1.6;
      color: #475569;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      width: 100%;
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background-color: #ffffff;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: #dc2626;
    }
    .welcome-title {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .admin-badge {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
      margin-top: 10px;
    }
    .content {
      padding: 30px 20px;
    }
    .alert-box {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      border-radius: 0 8px 8px 0;
      padding: 20px;
      margin: 20px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .info-card {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 15px;
      border: 1px solid #e5e7eb;
    }
    .info-card h4 {
      margin: 0 0 8px 0;
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-card p {
      margin: 0;
      color: #1f2937;
      font-weight: 600;
      font-size: 16px;
    }
    .details-section {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 500;
      color: #6b7280;
    }
    .detail-value {
      font-weight: 600;
      color: #1f2937;
      text-align: right;
    }
    .deliverable-card {
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 12px;
    }
    .platform-badge {
      background-color: #3b82f6;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }
    .cta-button {
      background-color: #dc2626;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
      margin: 10px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-complete {
      background-color: #dcfce7;
      color: #166534;
    }
    .status-progress {
      background-color: #fef3c7;
      color: #92400e;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>📦 Deliverable Submission Alert</h1>
      <span class="admin-badge">🔐 ADMIN NOTIFICATION</span>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h3 style="margin: 0 0 10px 0; color: #dc2626;">⚠️ New Deliverable Submission</h3>
        <p style="margin: 0;">A new deliverable has been submitted and requires monitoring.</p>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h4>Influencer</h4>
          <p>${influencer.name}</p>
        </div>
        <div class="info-card">
          <h4>Brand</h4>
          <p>${brand?.brandName || "N/A"}</p>
        </div>
        <div class="info-card">
          <h4>Deliverables Submitted</h4>
          <p>${deliverables.length}</p>
        </div>
        <div class="info-card">
          <h4>Campaign Progress</h4>
          <p>${totalSubmittedCount}/${requiredPostCount}</p>
        </div>
      </div>

      <div class="details-section">
        <h3 style="margin-top: 0; color: #374151;">Campaign Details</h3>
        <div class="detail-row">
          <span class="detail-label">Campaign ID:</span>
          <span class="detail-value">${campaignId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Campaign Name:</span>
          <span class="detail-value">${updatedCampaign.brandName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Influencer ID:</span>
          <span class="detail-value">${influencerId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Brand Email:</span>
          <span class="detail-value">${brand?.email || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Submission Time:</span>
          <span class="detail-value">${new Date().toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="status-badge ${
              totalSubmittedCount >= requiredPostCount
                ? "status-complete"
                : "status-progress"
            }">
              ${
                totalSubmittedCount >= requiredPostCount
                  ? "✅ Complete"
                  : "⏳ In Progress"
              }
            </span>
          </span>
        </div>
      </div>

      <h3 style="color: #374151;">Submitted Deliverables</h3>
      ${deliverables
        .map(
          (deliverable, index) => `
        <div class="deliverable-card">
          <div style="margin-bottom: 10px;">
            <span class="platform-badge">${deliverable.platform}</span>
          </div>
          <p style="margin: 0 0 8px 0; font-weight: 500;">${
            deliverable.description
          }</p>
          ${
            deliverable.metrics
              ? `
            <p style="margin: 8px 0; font-size: 13px; color: #6b7280;">
              ${
                deliverable.metrics.views
                  ? `Views: ${deliverable.metrics.views.toLocaleString()} | `
                  : ""
              }
              ${
                deliverable.metrics.likes
                  ? `Likes: ${deliverable.metrics.likes.toLocaleString()} | `
                  : ""
              }
              ${
                deliverable.metrics.comments
                  ? `Comments: ${deliverable.metrics.comments.toLocaleString()} | `
                  : ""
              }
              ${
                deliverable.metrics.shares
                  ? `Shares: ${deliverable.metrics.shares.toLocaleString()}`
                  : ""
              }
            </p>
          `
              : ""
          }
          <a href="${
            deliverable.url
          }" style="color: #3b82f6; text-decoration: none; font-size: 14px;" target="_blank">🔗 View Post</a>
        </div>
      `
        )
        .join("")}

      ${
        totalSubmittedCount >= requiredPostCount
          ? `
        <div style="background-color: #dcfce7; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #166534;"><strong>✅ Campaign Deliverables Complete</strong><br>All required posts have been submitted. Monitor for quality and payment processing.</p>
        </div>
      `
          : `
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #92400e;"><strong>⏳ ${Math.max(
            0,
            requiredPostCount - totalSubmittedCount
          )} More Post${
              Math.max(0, requiredPostCount - totalSubmittedCount) !== 1
                ? "s"
                : ""
            } Required</strong><br>Campaign is still in progress.</p>
        </div>
      `
      }

      <div style="text-align: center; margin: 30px 0;">
        <a href="${
          process.env.FRONTEND_URL || "https://theprgod.com"
        }/admin/campaigns/${campaignId}" class="cta-button">View in Admin Panel</a>
      </div>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        This is an automated system notification for platform monitoring.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>The•PR•God Admin System</strong></p>
      <p>© ${new Date().getFullYear()} The•PR•God. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
      };

      await transporter.sendMail(adminMailOptions);
    } catch (adminEmailError) {
      console.error("Failed to send email to admin:", adminEmailError);
    }

    const responseMessage =
      totalSubmittedCount >= requiredPostCount
        ? `All ${requiredPostCount} deliverables submitted successfully. You can now mark the campaign as complete.`
        : `${deliverables.length} deliverable(s) submitted successfully. ${
            requiredPostCount - totalSubmittedCount
          } more post(s) needed to complete the campaign.`;

    res.status(200).json({
      success: true,
      message: responseMessage,
      data: {
        campaign: updatedCampaign,
        submittedJobs: deliverables.length,
        totalSubmittedJobs: totalSubmittedCount,
        requiredPosts: requiredPostCount,
        remainingPosts: Math.max(0, requiredPostCount - totalSubmittedCount),
        submittedAt: new Date(),
        isCompleted: completionStatus,
        allPostsSubmitted: totalSubmittedCount >= requiredPostCount,
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

// Get deliverable status (not in use)
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

// Mark campaign as complete (influencer side)
export const markCampaignAsComplete = async (
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

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format.",
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
        message:
          "Campaign not found, not assigned to you, or you haven't accepted this campaign.",
      });
    }

    const influencerAssignment = campaign.assignedInfluencers.find(
      (assignment) => assignment.influencerId.toString() === influencerId
    );

    if (!influencerAssignment) {
      return res.status(404).json({
        success: false,
        message: "You are not assigned to this campaign.",
      });
    }

    if (influencerAssignment.isCompleted === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This campaign is already marked as complete.",
      });
    }

    const requiredPostCount =
      campaign.postCount || extractPostCount(campaign.postFrequency);
    const submittedJobsCount = influencerAssignment.submittedJobs?.length || 0;

    // Check if all required posts have been submitted
    if (submittedJobsCount < requiredPostCount) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark as complete. You have submitted ${submittedJobsCount} out of ${requiredPostCount} required posts. Please submit all deliverables before marking as complete.`,
        data: {
          requiredPosts: requiredPostCount,
          submittedPosts: submittedJobsCount,
          remainingPosts: requiredPostCount - submittedJobsCount,
        },
      });
    }

    // Mark as complete
    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      {
        $set: {
          "assignedInfluencers.$.isCompleted": "Completed",
          "assignedInfluencers.$.completedAt": new Date(),
        },
      },
      { new: true, runValidators: true }
    ).populate("userId", "name phone brandName brandPhone");

    if (!updatedCampaign) {
      return res.status(500).json({
        success: false,
        message: "Failed to mark campaign as complete.",
      });
    }

    // Get influencer details
    const influencer = await Influencer.findById(influencerId).select("name");

    // Send WhatsApp notification to brand
    try {
      const brand = updatedCampaign.userId as any;

      if (brand?.brandPhone) {
        const whatsappResult = await sendCampaignCompletionWhatsApp(
          brand.brandPhone,
          brand.brandName || "Brand",
          influencer?.name || "Influencer",
          updatedCampaign.brandName,
          submittedJobsCount
        );

        if (!whatsappResult.success) {
          console.error(
            "Failed to send WhatsApp to brand:",
            whatsappResult.error
          );
        }
      }
    } catch (notificationError) {
      console.error("Failed to send WhatsApp notification:", notificationError);
    }

    res.status(200).json({
      success: true,
      message: `Campaign marked as complete! All ${requiredPostCount} deliverables have been submitted.`,
      data: {
        campaign: updatedCampaign,
        completedAt: new Date(),
        totalSubmittedPosts: submittedJobsCount,
        requiredPosts: requiredPostCount,
      },
    });
  } catch (error: any) {
    console.error("Mark campaign complete error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while marking campaign as complete.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Stash deliverables
export const stashDeliverables = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { campaignId } = req.params;
    const {
      deliverables,
      stashName,
    }: {
      deliverables: DeliverableSubmission[];
      stashName?: string;
    } = req.body;
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
        message: "At least one deliverable is required to stash.",
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
        message:
          "Campaign not found, not assigned to you, or you haven't accepted this campaign.",
      });
    }

    const influencerAssignment = campaign.assignedInfluencers.find(
      (assignment) => assignment.influencerId.toString() === influencerId
    );

    if (!influencerAssignment) {
      return res.status(404).json({
        success: false,
        message: "You are not assigned to this campaign.",
      });
    }

    if (influencerAssignment.isCompleted === "Completed") {
      return res.status(400).json({
        success: false,
        message:
          "You have already completed this campaign. Cannot stash deliverables.",
      });
    }

    // Create new stash object
    const newStash = {
      stashId: new mongoose.Types.ObjectId().toString(),
      stashName:
        stashName ||
        `Draft ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      deliverables: deliverables.map((d) => ({
        platform: d.platform,
        url: d.url,
        description: d.description,
        metrics: d.metrics || {
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
        },
      })),
      stashedAt: new Date(),
    };

    // Add to existing stashes (append to array)
    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      {
        $push: {
          "assignedInfluencers.$.stashedDeliverables": newStash,
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedCampaign) {
      return res.status(500).json({
        success: false,
        message: "Failed to stash deliverables.",
      });
    }

    const requiredPostCount =
      campaign.postCount || extractPostCount(campaign.postFrequency);

    res.status(200).json({
      success: true,
      message: `Successfully stashed ${deliverables.length} deliverable(s) as draft.`,
      data: {
        stashId: newStash.stashId,
        stashName: newStash.stashName,
        deliverablesCount: deliverables.length,
        requiredPosts: requiredPostCount,
        stashedAt: newStash.stashedAt,
      },
    });
  } catch (error: any) {
    console.error("Stash deliverables error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while stashing deliverables.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Get all stashed deliverables
export const getStashedDeliverables = async (
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

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format.",
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
        postCount: 1,
        postFrequency: 1,
      }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found or you're not assigned to it.",
      });
    }

    const influencerAssignment = campaign.assignedInfluencers[0];
    const stashedDeliverables = influencerAssignment.stashedDeliverables || [];
    const requiredPostCount =
      campaign.postCount || extractPostCount(campaign.postFrequency);

    res.status(200).json({
      success: true,
      data: {
        stashes: stashedDeliverables,
        totalStashes: stashedDeliverables.length,
        requiredPosts: requiredPostCount,
        campaignName: campaign.brandName,
      },
    });
  } catch (error: any) {
    console.error("Get stashed deliverables error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching stashed deliverables.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Get a specific stash by ID
export const getStashById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { campaignId, stashId } = req.params;
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
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found or you're not assigned to it.",
      });
    }

    const influencerAssignment = campaign.assignedInfluencers.find(
      (a) => a.influencerId.toString() === influencerId
    );

    const stash = influencerAssignment?.stashedDeliverables?.find(
      (s: any) => s.stashId === stashId
    );

    if (!stash) {
      return res.status(404).json({
        success: false,
        message: "Stash not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: stash,
    });
  } catch (error: any) {
    console.error("Get stash by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Delete a specific stash
export const deleteStash = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, stashId } = req.params;
    const influencerId = req.user?.id || req.user?._id;

    if (!influencerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      {
        $pull: {
          "assignedInfluencers.$.stashedDeliverables": { stashId },
        },
      },
      { new: true }
    );

    if (!updatedCampaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found or stash not deleted.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stash deleted successfully.",
    });
  } catch (error: any) {
    console.error("Delete stash error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting stash.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Delete all stashed deliverables
export const deleteStashedDeliverables = async (
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

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid campaign ID format.",
      });
    }

    const updatedCampaign = await Campaign.findOneAndUpdate(
      {
        _id: campaignId,
        "assignedInfluencers.influencerId": new mongoose.Types.ObjectId(
          influencerId
        ),
      },
      {
        $set: {
          "assignedInfluencers.$.stashedDeliverables": [],
        },
      },
      { new: true }
    );

    if (!updatedCampaign) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete stashed deliverables.",
      });
    }

    res.status(200).json({
      success: true,
      message: "All stashed deliverables deleted successfully.",
      data: {
        deletedAt: new Date(),
      },
    });
  } catch (error: any) {
    console.error("Delete stashed deliverables error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting stashed deliverables.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Update the submitted deliverables
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
      "assignedInfluencers.isCompleted": true,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message:
          "Campaign not found or you haven't completed deliverables yet.",
      });
    }

    const requiredPostCount =
      campaign.postCount || extractPostCount(campaign.postFrequency);

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
          "assignedInfluencers.$.isCompleted": "Completed",
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
