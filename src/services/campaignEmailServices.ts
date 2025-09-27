import nodemailer from "nodemailer";

interface Influencer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
}

// Updated Campaign interface to match your actual campaign data structure
interface Campaign {
  _id: string;
  role?: string;
  brandName: string;
  email?: string;
  platforms?: string[];
  location?: string;
  followersRange?: string;
  postFrequency?: string;
  postDuration?: string;
  totalCost?: number;
  totalBaseCost?: number;
  budget?: number; // Keep for backward compatibility
  title?: string; // This might not exist in your schema
  description?: string; // This might not exist in your schema
  assignedInfluencers?: Influencer[];
  influencersMin?: number;
  influencersMax?: number;
  [key: string]: any;
}

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendPaymentConfirmationEmail = async (
  to: string,
  brandName: string,
  campaign: Campaign
) => {
  const companyName = "CaringSparks";
  const loginUrl = "https://caring-sparks.vercel.app";
  const supportEmail = "support@caringsparks.com";

  const transporter = createTransporter();

  // Use a fallback for campaign title since it might not exist
  const campaignTitle =
    campaign.title || `${campaign.role || "Campaign"} for ${brandName}`;
  const campaignBudget =
    campaign.totalCost || campaign.totalBaseCost || campaign.budget || 0;

  const subject = `🎉 Payment Confirmed - ${campaignTitle} is Now Active!`;

  const mailOptions = {
    from: `"CaringSparks Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
      color: #10b981;
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
      background-color: #d1fae5;
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
      color: #10b981;
      margin-bottom: 15px;
    }

    .status-message {
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
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

    .next-steps {
      background-color: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
    }

    .next-steps h3 {
      color: #d97706;
      margin-top: 0;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .steps-list {
      color: #92400e;
      margin: 0;
      padding-left: 20px;
    }

    .steps-list li {
      margin-bottom: 8px;
    }

    .cta-container {
      text-align: center;
      margin: 30px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      margin: 0 10px 10px 0;
    }

    .cta-button-secondary {
      display: inline-block;
      background: #ffffff;
      color: #10b981 !important;
      text-decoration: none;
      padding: 14px 28px;
      border: 2px solid #10b981;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
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
      color: #10b981;
      text-decoration: none;
      margin: 0 10px;
      font-size: 13px;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    @media only screen and (max-width: 600px) {
      .welcome-title {
        font-size: 22px !important;
      }
      .intro-text {
        font-size: 15px !important;
      }
      .cta-button, .cta-button-secondary {
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
      <div class="logo">🎉</div>
      <h1 class="welcome-title">Payment Confirmed!</h1>
    </div>
    
    <div class="content">
      <p class="intro-text">
        Great news, <strong>${brandName}</strong>! Your payment has been successfully processed and your campaign is now active on CaringSparks.
      </p>
      
      <div class="status-card">
        <h2 class="status-title">✅ Campaign Activated</h2>
        <div class="status-message">
          Your campaign "${campaignTitle}" is now live and ready for influencer collaboration. It's time to upload your campaign materials!
        </div>
      </div>
      
      <div class="campaign-details">
        <h3>📋 Campaign Overview</h3>
        <div class="detail-row">
          <span class="detail-label">Campaign Type:</span>
          <span class="detail-value">${campaign.role || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Budget:</span>
          <span class="detail-value">$${campaignBudget.toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Brand:</span>
          <span class="detail-value">${campaign.brandName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Platforms:</span>
          <span class="detail-value">${
            campaign.platforms?.join(", ") || "N/A"
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${campaign.location || "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Campaign ID:</span>
          <span class="detail-value">#${campaign._id
            .toString()
            .slice(-8)
            .toUpperCase()}</span>
        </div>
      </div>
      
      <div class="next-steps">
        <h3>📤 Next Steps - Upload Campaign Materials</h3>
        <ul class="steps-list">
          <li><strong>Upload brand assets</strong> (logos, product images, brand guidelines)</li>
          <li><strong>Provide campaign brief</strong> with detailed instructions for influencers</li>
          <li><strong>Set campaign timeline</strong> and key milestones</li>
          <li><strong>Add any specific requirements</strong> or content guidelines</li>
          <li><strong>Review and publish</strong> materials for assigned influencers</li>
        </ul>
      </div>
      
      <div class="cta-container">
        <a href="${loginUrl}/brand/campaigns" class="cta-button">
          Upload Campaign Materials
        </a>
        <a href="mailto:${supportEmail}" class="cta-button-secondary">
          Get Support
        </a>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        Once you've uploaded your campaign materials, assigned influencers will be able to start working on your campaign immediately.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        This email was sent regarding your ${
          campaign.role || "campaign"
        } on CaringSparks.
      </p>
      
      <div class="footer-links">
        <a href="${loginUrl}/brand">Dashboard</a>
        <a href="mailto:${supportEmail}">Support</a>
        <a href="https://caring-sparks.vercel.app/">Privacy Policy</a>
      </div>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} CaringSparks. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
    throw error;
  }
};

export const sendInfluencersAssignedEmail = async (
  to: string,
  brandName: string,
  campaign: Campaign,
  assignedInfluencers: Influencer[]
) => {
  const companyName = "CaringSparks";
  const loginUrl = "https://caring-sparks.vercel.app";
  const supportEmail = "support@caringsparks.com";

  const transporter = createTransporter();

  // Use fallback for campaign title
  const campaignTitle =
    campaign.title || `${campaign.role || "Campaign"} for ${brandName}`;
  const campaignBudget =
    campaign.totalCost || campaign.totalBaseCost || campaign.budget || 0;

  const subject = `🚀 Influencers Assigned - ${campaignTitle} Ready to Launch!`;

  const influencersList = assignedInfluencers
    .map(
      (influencer, index) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background-color: ${
      index % 2 === 0 ? "#f8fafc" : "#ffffff"
    }; border-radius: 6px; margin-bottom: 8px;">
      <div>
        <div style="font-weight: 600; color: #374151;">${influencer.name}</div>
        <div style="font-size: 13px; color: #64748b;">${influencer.email}</div>
        ${
          influencer.location
            ? `<div style="font-size: 12px; color: #9ca3af;">📍 ${influencer.location}</div>`
            : ""
        }
      </div>
      <div style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">
        ASSIGNED
      </div>
    </div>
  `
    )
    .join("");

  const mailOptions = {
    from: `"CaringSparks Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
      color: #3b82f6;
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
      background-color: #dbeafe;
      border: 2px solid #3b82f6;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .status-title {
      font-size: 18px;
      font-weight: 700;
      color: #1d4ed8;
      margin-bottom: 15px;
    }

    .status-message {
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
    }

    .campaign-summary {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }

    .campaign-summary h3 {
      color: #374151;
      margin-top: 0;
      font-size: 18px;
      margin-bottom: 15px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .summary-row:last-child {
      border-bottom: none;
    }

    .summary-label {
      font-weight: 600;
      color: #64748b;
    }

    .summary-value {
      color: #374151;
      font-weight: 500;
    }

    .influencers-section {
      background-color: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
    }

    .influencers-section h3 {
      color: #0369a1;
      margin-top: 0;
      font-size: 18px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .next-steps {
      background-color: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
    }

    .next-steps h3 {
      color: #059669;
      margin-top: 0;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .steps-list {
      color: #065f46;
      margin: 0;
      padding-left: 20px;
    }

    .steps-list li {
      margin-bottom: 8px;
    }

    .cta-container {
      text-align: center;
      margin: 30px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      margin: 0 10px 10px 0;
    }

    .cta-button-secondary {
      display: inline-block;
      background: #ffffff;
      color: #3b82f6 !important;
      text-decoration: none;
      padding: 14px 28px;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
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
      color: #3b82f6;
      text-decoration: none;
      margin: 0 10px;
      font-size: 13px;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    @media only screen and (max-width: 600px) {
      .welcome-title {
        font-size: 22px !important;
      }
      .intro-text {
        font-size: 15px !important;
      }
      .cta-button, .cta-button-secondary {
        display: block !important;
        width: calc(100% - 40px) !important;
        margin: 10px 0 !important;
      }
      .summary-row {
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
      <div class="logo">🚀</div>
      <h1 class="welcome-title">Influencers Assigned!</h1>
    </div>
    
    <div class="content">
      <p class="intro-text">
        Excellent news, <strong>${brandName}</strong>! We've successfully assigned ${
      assignedInfluencers.length
    } qualified influencers to your "${campaignTitle}" campaign.
      </p>
      
      <div class="status-card">
        <h2 class="status-title">👥 Team Assembled</h2>
        <div class="status-message">
          Your campaign now has a dedicated team of ${
            assignedInfluencers.length
          } influencer${
      assignedInfluencers.length > 1 ? "s" : ""
    } ready to create amazing content for your brand!
        </div>
      </div>
      
      <div class="campaign-summary">
        <h3>📊 Campaign Summary</h3>
        <div class="summary-row">
          <span class="summary-label">Campaign Type:</span>
          <span class="summary-value">${campaign.role || "N/A"}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Budget:</span>
          <span class="summary-value">$${campaignBudget.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Platforms:</span>
          <span class="summary-value">${
            campaign.platforms?.join(", ") || "N/A"
          }</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Assigned Influencers:</span>
          <span class="summary-value">${assignedInfluencers.length}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">Campaign ID:</span>
          <span class="summary-value">#${campaign._id
            .toString()
            .slice(-8)
            .toUpperCase()}</span>
        </div>
      </div>
      
      <div class="influencers-section">
        <h3>👑 Your Assigned Influencers</h3>
        ${influencersList}
      </div>
      
      <div class="next-steps">
        <h3>✅ What Happens Next?</h3>
        <ul class="steps-list">
          <li><strong>Influencers will be notified</strong> about their assignment to your campaign</li>
          <li><strong>They'll review your campaign materials</strong> and brand guidelines</li>
          <li><strong>Content creation begins</strong> according to your timeline</li>
          <li><strong>You'll receive content drafts</strong> for review and approval</li>
          <li><strong>Approved content goes live</strong> across their social channels</li>
          <li><strong>Track campaign performance</strong> through your dashboard</li>
        </ul>
      </div>
      
      <div class="cta-container">
        <a href="${loginUrl}/brand" class="cta-button">
          View Campaign Dashboard
        </a>
        <a href="mailto:${supportEmail}" class="cta-button-secondary">
          Contact Support
        </a>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        Your influencers are excited to work with ${brandName}! They'll start creating content as soon as they receive their assignment notifications.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        This email was sent regarding your campaign "${campaignTitle}" on CaringSparks.
      </p>
      
      <div class="footer-links">
        <a href="${loginUrl}/brand">Dashboard</a>
        <a href="mailto:${supportEmail}">Support</a>
        <a href="https://caring-sparks.vercel.app/">Privacy Policy</a>
      </div>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} CaringSparks. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Influencers assigned email sent successfully to ${brandName} (${to})`
    );
  } catch (error) {
    console.error("Error sending influencers assigned email:", error);
    throw error;
  }
};

export const sendInfluencerAssignmentEmail = (
  influencerEmail: string,
  influencerName: string,
  campaign: any,
  loginUrl = "https://caring-sparks.vercel.app",
  supportEmail = "support@caringsparks.com"
) => {
  const campaignTitle =
    campaign.title ||
    `${campaign.role || "Brand Partnership"} with ${campaign.brandName}`;

  const subject = `🎯 New Campaign Assignment: ${campaignTitle}`;
  const campaignBudget =
    campaign.totalCost || campaign.totalBaseCost || campaign.budget || 0;

  return {
    to: influencerEmail,
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
      background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
      border: 2px solid #8b5cf6;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .status-title {
      font-size: 18px;
      font-weight: 700;
      color: #7c3aed;
      margin-bottom: 15px;
    }

    .status-message {
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
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

    .compensation-card {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
    }

    .compensation-title {
      color: #059669;
      margin-top: 0;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .compensation-amount {
      font-size: 24px;
      font-weight: 800;
      color: #065f46;
      margin-bottom: 5px;
    }

    .compensation-note {
      color: #047857;
      font-size: 13px;
    }

    .action-required {
      background-color: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
    }

    .action-required h3 {
      color: #d97706;
      margin-top: 0;
      font-size: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-list {
      color: #92400e;
      margin: 0;
      padding-left: 20px;
    }

    .action-list li {
      margin-bottom: 8px;
    }

    .deadline-info {
      background-color: #fef2f2;
      border: 2px solid #ef4444;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
    }

    .deadline-title {
      color: #dc2626;
      margin-top: 0;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .deadline-date {
      font-size: 18px;
      font-weight: 800;
      color: #991b1b;
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

    .cta-button-secondary {
      display: inline-block;
      background: #ffffff;
      color: #8b5cf6 !important;
      text-decoration: none;
      padding: 14px 28px;
      border: 2px solid #8b5cf6;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 0 10px 10px 0;
    }

    .cta-button-accept {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      margin: 0 10px 10px 0;
    }

    .cta-button-decline {
      display: inline-block;
      background: #ffffff;
      color: #ef4444 !important;
      text-decoration: none;
      padding: 14px 28px;
      border: 2px solid #ef4444;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
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

    @media only screen and (max-width: 600px) {
      .welcome-title {
        font-size: 22px !important;
      }
      .intro-text {
        font-size: 15px !important;
      }
      .cta-button, .cta-button-secondary, .cta-button-accept, .cta-button-decline {
        display: block !important;
        width: calc(100% - 40px) !important;
        margin: 10px 0 !important;
      }
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
      .compensation-amount {
        font-size: 20px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">🎯</div>
      <h1 class="welcome-title">Campaign Assignment!</h1>
    </div>
    
    <div class="content">
      <p class="intro-text">
        Exciting news, <strong>${influencerName}</strong>! You've been selected for a new campaign collaboration with <strong>${
      campaign.brandName
    }</strong>. This is a great opportunity to showcase your influence and earn rewards!
      </p>
      
      <div class="status-card">
        <h2 class="status-title">🌟 You're Invited!</h2>
        <div class="status-message">
          You have been assigned to the "${campaignTitle}" campaign. The brand has specifically chosen you based on your profile and audience alignment.
        </div>
      </div>
      
      <div class="campaign-details">
        <h3>📋 Campaign Details</h3>
        <div class="detail-row">
          <span class="detail-label">Campaign:</span>
          <span class="detail-value">${campaignTitle}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Brand:</span>
          <span class="detail-value">${campaign.brandName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${
            campaign.role || "Brand Partnership"
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Platforms:</span>
          <span class="detail-value">${
            campaign.platforms?.join(", ") || "Multiple Platforms"
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${campaign.location || "Flexible"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${
            campaign.postDuration || "As specified in brief"
          }</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Campaign ID:</span>
          <span class="detail-value">#${campaign._id
            .toString()
            .slice(-8)
            .toUpperCase()}</span>
        </div>
      </div>
      
      <div class="action-required">
        <h3>🚀 Action Required</h3>
        <ul class="action-list">
          <li><strong>Review the campaign brief</strong> and requirements in your dashboard</li>
          <li><strong>Accept or decline</strong> the campaign assignment</li>
          <li><strong>Start planning</strong> your content strategy (if accepting)</li>
          <li><strong>Submit deliverables</strong> according to the timeline</li>
        </ul>
      </div>
      
      <div class="cta-container">
        <a href="${loginUrl}/influencer" class="cta-button-accept">
          Accept Campaign
        </a>
        <a href="${loginUrl}/influencer" class="cta-button">
          View Details
        </a>
        <a href="${loginUrl}/influencer" class="cta-button-decline">
          Decline
        </a>
      </div>
      
      <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #0369a1; font-size: 14px; font-weight: 500;">
          💡 <strong>Pro Tip:</strong> Respond quickly to show professionalism and secure your spot in high-quality campaigns!
        </p>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        Please log in to your dashboard to accept/decline this assignment and view the complete campaign brief with detailed requirements.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        This email was sent regarding your campaign assignment on CaringSparks.
      </p>
      
      <div class="footer-links">
        <a href="${loginUrl}/influencer">Dashboard</a>
        <a href="mailto:${supportEmail}">Support</a>
        <a href="https://caring-sparks.vercel.app/help">Help Center</a>
        <a href="https://caring-sparks.vercel.app/privacy">Privacy Policy</a>
      </div>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} CaringSparks. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
  };
};
