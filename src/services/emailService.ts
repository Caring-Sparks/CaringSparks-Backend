import nodemailer from "nodemailer";

export const sendBrandEmail = async (
  to: string,
  password: string,
  brandName: string
) => {
  const companyName = "CaringSparks";
  const loginUrl = "https://caring-sparks.vercel.app/";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const brandMailOptions = {
    from: `"CaringSparks - " <${process.env.EMAIL_USER}>`,
    to,
    subject: `Welcome to CaringSparks, ${brandName}!`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName}</title>
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

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
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
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
      color: #4f46e5;
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

    .credentials-card {
      background-color: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .credentials-title {
      font-size: 18px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 15px;
      text-align: center;
    }

    .credential-row {
      margin-bottom: 12px;
    }

    .credential-label {
      font-weight: 600;
      color: #64748b;
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
    }

    .credential-value {
      display: block;
      background-color: #f1f5f9;
      padding: 10px 14px;
      border-radius: 6px;
      color: #1e293b;
      font-weight: 600;
      font-size: 16px;
      word-break: break-all;
      text-align: center;
    }

    .security-note {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .security-note p {
      margin: 0;
      color: #92400e;
      font-size: 13px;
      line-height: 1.5;
    }

    .cta-container {
      text-align: center;
      margin: 30px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
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
      color: #4f46e5;
      text-decoration: none;
      margin: 0 10px;
      font-size: 13px;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .welcome-title {
        font-size: 22px !important;
      }
      .intro-text {
        font-size: 15px !important;
      }
      .credential-value {
        font-size: 14px !important;
        padding: 8px 10px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🏢</div>
      <h1 class="welcome-title">Welcome to CaringSparks!</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p class="intro-text">
        🎉 Congratulations <strong>${brandName}</strong>! Your brand has officially joined our platform.  
        We're excited to help you connect with audiences, run impactful campaigns, 
        and grow your brand presence with us.
      </p>
      
      <!-- Credentials Card -->
      <div class="credentials-card">
        <h2 class="credentials-title">Your Login Credentials</h2>
        
        <div class="credential-row">
          <span class="credential-label">Brand Name</span>
          <span class="credential-value">${brandName}</span>
        </div>
        
        <div class="credential-row">
          <span class="credential-label">Email</span>
          <span class="credential-value">${to}</span>
        </div>
        
        <div class="credential-row">
          <span class="credential-label">Password</span>
          <span class="credential-value">${password}</span>
        </div>
      </div>

      <!-- Security Note -->
      <div class="security-note">
        <p>
          <strong>🔒 Security Reminder:</strong> Please change your password 
          after your first login and never share it with anyone.
        </p>
      </div>
      
      <!-- Call to Action -->
      <div class="cta-container">
        <a href="${loginUrl}" class="cta-button">
          Access Your Brand Dashboard
        </a>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        From launching campaigns to tracking results — your journey starts here.  
        Our support team is always ready to assist you.
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This email was sent to ${to} because ${brandName} was registered on CaringSparks.
      </p>
      
      <div class="footer-links">
        <a href="${loginUrl}">Login</a>
        <a href="mailto:support@caringsparks.com">Support</a>
        <a href="https://caring-sparks.vercel.app/">Privacy Policy</a>
      </div>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} CaringSparks. All rights reserved.  
      </p>
    </div>
  </div>
</body>
</html>
`,
  };

  const adminMailOptions = {
    from: `"CaringSparks System" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `🎉 New Brand Registration: ${brandName} - CaringSparks`, // Added brand name here
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Brand Registration</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Source Sans Pro', Arial, sans-serif;
      line-height: 1.6;
      color: #475569;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 30px 20px;
    }
    .brand-info {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      margin-bottom: 10px;
    }
    .info-label {
      font-weight: 600;
      color: #374151;
      display: inline-block;
      width: 120px;
    }
    .info-value {
      color: #1f2937;
      font-weight: 500;
    }
    .timestamp {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .highlight {
      background-color: #ddd6fe;
      padding: 2px 6px;
      border-radius: 4px;
      color: #5b21b6;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎉 New Brand Registration</h1>
    </div>
    
    <div class="content">
      <p>A new brand <span class="highlight">${brandName}</span> has successfully registered on the CaringSparks platform!</p>
      
      <div class="brand-info">
        <h3 style="margin-top: 0; color: #374151;">Brand Details:</h3>
        <div class="info-row">
          <span class="info-label">Brand Name:</span>
          <span class="info-value">${brandName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${to}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value">✅ Active</span>
        </div>
        <div class="info-row">
          <span class="info-label">Platform:</span>
          <span class="info-value">CaringSparks</span>
        </div>
      </div>
      
      <div class="timestamp">
        <p style="margin: 0;">
          <strong>Registration Time:</strong> ${new Date().toLocaleString()}
        </p>
      </div>
      
      <p>The brand <strong>${brandName}</strong> has been sent their welcome email with login credentials and can now access their dashboard.</p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        This is an automated notification from the CaringSparks registration system.
      </p>
    </div>
    
    <div class="footer">
      <p>CaringSparks Admin Notifications</p>
      <p>© ${new Date().getFullYear()} CaringSparks. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  };

  try {
    await Promise.all([
      transporter.sendMail(brandMailOptions),
      transporter.sendMail(adminMailOptions),
    ]);
  } catch (error) {
    console.error("Error sending emails:", error);
    throw error;
  }
};

export const sendCampaignStatusEmail = async (
  to: any,
  brandName: any,
  status: "approved" | "rejected",
  campaignBudget?: any,
  campaignDuration?: any
) => {
  const companyName = "CaringSparks";
  const loginUrl = "https://caring-sparks.vercel.app/";
  const supportEmail = "support@caringsparks.com";

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Determine email content based on status
  const isApproved = status === "approved";
  const statusEmoji = isApproved ? "🎉" : "📋";
  const statusColor = isApproved ? "#10b981" : "#ef4444";
  const statusBackground = isApproved ? "#d1fae5" : "#fee2e2";
  const statusBorder = isApproved ? "#10b981" : "#ef4444";
  const headerGradient = isApproved
    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";

  const subject = isApproved
    ? `🎉 Campaign Approved: "${brandName}" - Payment Required`
    : `📋 Campaign Update: "${brandName}" Status`;

  const mainMessage = isApproved
    ? `Great news, <strong>${brandName}</strong>! Your campaign "<strong>${brandName}</strong>" has been approved and is ready to go live. 
       To activate your campaign and start connecting with influencers, please complete your payment within the next 5 days.`
    : `Thank you for submitting your campaign "<strong>${brandName}</strong>", <strong>${brandName}</strong>. 
       After careful review, we're unable to approve your campaign in its current form.`;

  const paymentDeadline = new Date();
  paymentDeadline.setDate(paymentDeadline.getDate() + 5);

  const brandMailOptions = {
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
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }

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
      background: ${headerGradient};
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
      color: ${statusColor};
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
      background-color: ${statusBackground};
      border: 2px solid ${statusBorder};
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .status-title {
      font-size: 18px;
      font-weight: 700;
      color: ${statusColor};
      margin-bottom: 15px;
      text-align: center;
    }

    .campaign-details {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .detail-row {
      margin-bottom: 12px;
    }

    .detail-label {
      font-weight: 600;
      color: #64748b;
      display: inline-block;
      width: 140px;
      font-size: 14px;
    }

    .detail-value {
      color: #1e293b;
      font-weight: 500;
    }

    .campaign-title {
      background-color: #f1f5f9;
      padding: 12px 16px;
      border-radius: 6px;
      color: #1e293b;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 10px 0;
    }

    .payment-deadline {
      background-color: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
    }

    .deadline-title {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 10px;
    }

    .deadline-date {
      font-size: 20px;
      font-weight: 700;
      color: #92400e;
      background-color: #ffffff;
      padding: 10px 20px;
      border-radius: 8px;
      display: inline-block;
      margin: 10px 0;
    }

    .rejection-note {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .rejection-note p {
      margin: 0;
      color: #b91c1c;
      font-size: 14px;
      line-height: 1.5;
    }

    .next-steps {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }

    .next-steps h3 {
      color: #374151;
      margin-top: 0;
      font-size: 18px;
    }

    .steps-list {
      color: #475569;
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
      background: ${headerGradient};
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(${
        isApproved ? "16, 185, 129" : "239, 68, 68"
      }, 0.3);
      margin: 0 10px 10px 0;
    }

    .cta-button-secondary {
      display: inline-block;
      background: #ffffff;
      color: ${statusColor} !important;
      text-decoration: none;
      padding: 14px 28px;
      border: 2px solid ${statusColor};
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      margin: 0 10px 10px 0;
    }

    .warning-box {
      background-color: #fef2f2;
      border: 2px solid #ef4444;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      text-align: center;
    }

    .warning-text {
      color: #b91c1c;
      font-weight: 600;
      margin: 0;
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
      color: ${statusColor};
      text-decoration: none;
      margin: 0 10px;
      font-size: 13px;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .welcome-title {
        font-size: 22px !important;
      }
      .intro-text {
        font-size: 15px !important;
      }
      .detail-label {
        display: block !important;
        width: auto !important;
        margin-bottom: 5px;
      }
      .cta-button, .cta-button-secondary {
        display: block !important;
        width: calc(100% - 40px) !important;
        margin: 10px 0 !important;
      }
      .deadline-date {
        font-size: 18px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">${statusEmoji}</div>
      <h1 class="welcome-title">${
        isApproved ? "Campaign Approved!" : "Campaign Update"
      }</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p class="intro-text">
        ${mainMessage}
      </p>
      
      <!-- Campaign Details -->
      <div class="campaign-details">
        <h3 style="margin-top: 0; color: #374151; text-align: center;">Campaign Details</h3>
        <div class="campaign-title">${brandName}</div>
        
        ${
          campaignBudget
            ? `
        <div class="detail-row">
          <span class="detail-label">Budget:</span>
<span class="detail-value">₦${campaignBudget?.toLocaleString()}</span>
        </div>
        `
            : ""
        }
        
        ${
          campaignDuration
            ? `
        <div class="detail-row">
          <span class="detail-label">Duration:</span>
          <span class="detail-value">${campaignDuration}</span>
        </div>
        `
            : ""
        }
        
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value" style="color: ${statusColor}; font-weight: 600; text-transform: capitalize;">${status}</span>
        </div>
      </div>

      ${
        isApproved
          ? `
      <!-- Payment Deadline -->
      <div class="payment-deadline">
        <div class="deadline-title">⏰ Payment Deadline</div>
        <p style="margin: 10px 0; color: #92400e;">Complete payment by:</p>
        <div class="deadline-date">${paymentDeadline.toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )}</div>
        <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
          (5 days from approval)
        </p>
      </div>

      <div class="warning-box">
        <p class="warning-text">
          ⚠️ Important: Failure to complete payment within 5 days will result in automatic campaign cancellation
        </p>
      </div>
      `
          : ""
      }
      
      <!-- Status Card -->
      <div class="status-card">
        <h2 class="status-title">
          ${isApproved ? "🎊 Ready to Launch!" : "📝 Next Steps"}
        </h2>
        <div style="text-align: center; color: #374151; line-height: 1.6;">
          ${
            isApproved
              ? `Your campaign has passed our review process and is ready to connect with top influencers. Complete your payment to activate the campaign immediately.`
              : `Please review the feedback above and make the necessary adjustments to your campaign. You can edit and resubmit your campaign through your dashboard.`
          }
        </div>
      </div>
      
      <!-- Next Steps -->
      <div class="next-steps">
        <h3>${
          isApproved ? "🚀 How to Proceed:" : "💡 How to Move Forward:"
        }</h3>
        ${
          isApproved
            ? `
        <ul class="steps-list">
          <li><strong>Complete Payment:</strong> Click the payment button below to secure your campaign slot</li>
          <li><strong>Campaign Activation:</strong> Your campaign goes live immediately after payment</li>
          <li><strong>Influencer Matching:</strong> We'll start connecting you with relevant influencers</li>
          <li><strong>Track Progress:</strong> Monitor applications and engagement through your dashboard</li>
          <li><strong>Campaign Management:</strong> Communicate directly with selected influencers</li>
        </ul>
        `
            : `
        <ul class="steps-list">
          <li>Review the feedback provided above carefully</li>
          <li>Edit your campaign details through your brand dashboard</li>
          <li>Address the specific concerns mentioned</li>
          <li>Resubmit your campaign for another review</li>
          <li>Contact support if you need clarification on any feedback</li>
        </ul>
        `
        }
      </div>
      
      <!-- Call to Action -->
      <div class="cta-container">
        ${
          isApproved
            ? `
        <a href="${loginUrl}/brands/campaigns" class="cta-button-secondary">
          View Campaign Details
        </a>
        `
            : `
        <a href="${loginUrl}/brands/campaigns" class="cta-button">
          Edit Campaign
        </a>
        <a href="mailto:${supportEmail}" class="cta-button-secondary">
          Contact Support
        </a>
        `
        }
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        ${
          isApproved
            ? "Questions about payment or campaign setup? Our support team is here to help!"
            : "Need help improving your campaign? Our team is ready to assist you!"
        }
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This email was sent to ${to} regarding your campaign "${brandName}" on CaringSparks.
      </p>
      
      <div class="footer-links">
        <a href="${loginUrl}">Dashboard</a>
        <a href="mailto:${supportEmail}">Support</a>
        <a href="https://caring-sparks.vercel.app/privacy">Privacy Policy</a>
      </div>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} CaringSparks. All rights reserved.  
      </p>
    </div>
  </div>
</body>
</html>
`,
  };

  try {
    // Send both emails
    await Promise.all([transporter.sendMail(brandMailOptions)]);

    console.log(
      `Campaign ${status} email sent successfully to ${brandName} (${to})`
    );
  } catch (error) {
    console.error("Error sending campaign status emails:", error);
    throw error;
  }
};

// Types for campaign data
interface CampaignData {
  brandName: string;
  email: string;
  brandPhone: string;
  role: string;
  platforms: string[];
  location: string;
  additionalLocations?: string[];
  influencersMin: number;
  influencersMax: number;
  followersRange?: string;
  postFrequency?: string;
  postDuration?: string;
  avgInfluencers?: number;
  postCount?: number;
  costPerInfluencerPerPost?: number;
  totalBaseCost?: number;
  platformFee?: number;
  totalCost?: number;
  hasPaid?: boolean;
}

interface SavedCampaign {
  _id: string;
  [key: string]: any;
}

interface EmailResults {
  adminEmailSent: boolean;
  brandEmailSent: boolean;
  adminEmailId: string | null;
  brandEmailId: string | null;
  errors: {
    admin: Error | null;
    brand: Error | null;
  };
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send campaign creation emails
export const sendCampaignEmails = async (
  campaignData: CampaignData,
  savedCampaign: SavedCampaign | any
): Promise<EmailResults> => {
  try {
    const {
      brandName,
      email: userEmail,
      brandPhone,
      role,
      platforms,
      location,
      additionalLocations = [],
      influencersMin,
      influencersMax,
      followersRange,
      postFrequency,
      postDuration,
      avgInfluencers,
      postCount,
      costPerInfluencerPerPost,
      totalBaseCost,
      platformFee,
      totalCost,
      hasPaid = false,
    } = campaignData;

    // Admin Email Template
    const adminCampaignMailOptions = {
      from: `"CaringSparks System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `🚀 New Campaign Created: ${brandName} - ${platforms.join(
        ", "
      )} Campaign - CaringSparks`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Campaign Created</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Source Sans Pro', Arial, sans-serif;
      line-height: 1.6;
      color: #475569;
    }
    .email-container {
      max-width: 650px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 30px 20px;
    }
    .campaign-info {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-section {
      margin-bottom: 25px;
    }
    .info-section h4 {
      margin: 0 0 15px 0;
      color: #374151;
      font-size: 16px;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .info-row {
      margin-bottom: 8px;
      display: flex;
      flex-wrap: wrap;
    }
    .info-label {
      font-weight: 600;
      color: #374151;
      display: inline-block;
      width: 140px;
      flex-shrink: 0;
    }
    .info-value {
      color: #1f2937;
      font-weight: 500;
      flex: 1;
    }
    .platforms {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 5px;
    }
    .platform-tag {
      background-color: #3b82f6;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .cost-highlight {
      background-color: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .cost-amount {
      font-size: 24px;
      font-weight: 700;
      color: #92400e;
    }
    .timestamp {
      background-color: #e0f2fe;
      border-left: 4px solid #0891b2;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .highlight {
      background-color: #dcfce7;
      padding: 2px 6px;
      border-radius: 4px;
      color: #166534;
      font-weight: 600;
    }
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-paid {
      background-color: #dcfce7;
      color: #166534;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🚀 New Campaign Created</h1>
    </div>
    
    <div class="content">
      <p>A new campaign has been created by <span class="highlight">${brandName}</span> on the CaringSparks platform!</p>
      
      <div class="campaign-info">
        <div class="info-section">
          <h4>Brand Information</h4>
          <div class="info-row">
            <span class="info-label">Brand Name:</span>
            <span class="info-value">${brandName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${userEmail}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span class="info-value">${brandPhone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Role:</span>
            <span class="info-value">${role}</span>
          </div>
        </div>

        <div class="info-section">
          <h4>Campaign Details</h4>
          <div class="info-row">
            <span class="info-label">Platforms:</span>
            <div class="platforms">
              ${platforms
                .map(
                  (platform) => `<span class="platform-tag">${platform}</span>`
                )
                .join("")}
            </div>
          </div>
          <div class="info-row">
            <span class="info-label">Location:</span>
            <span class="info-value">${location}</span>
          </div>
          ${
            additionalLocations && additionalLocations.length > 0
              ? `
          <div class="info-row">
            <span class="info-label">Additional Locations:</span>
            <span class="info-value">${additionalLocations.join(", ")}</span>
          </div>
          `
              : ""
          }
          <div class="info-row">
            <span class="info-label">Influencers Range:</span>
            <span class="info-value">${influencersMin} - ${influencersMax} influencers</span>
          </div>
          ${
            followersRange
              ? `
          <div class="info-row">
            <span class="info-label">Followers Range:</span>
            <span class="info-value">${followersRange}</span>
          </div>
          `
              : ""
          }
          ${
            postFrequency
              ? `
          <div class="info-row">
            <span class="info-label">Post Frequency:</span>
            <span class="info-value">${postFrequency}</span>
          </div>
          `
              : ""
          }
          ${
            postDuration
              ? `
          <div class="info-row">
            <span class="info-label">Campaign Duration:</span>
            <span class="info-value">${postDuration}</span>
          </div>
          `
              : ""
          }
        </div>

        <div class="info-section">
          <h4>Financial Details</h4>
          <div class="info-row">
            <span class="info-label">Average Influencers:</span>
            <span class="info-value">${avgInfluencers || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Post Count:</span>
            <span class="info-value">${postCount || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cost per Influencer:</span>
            <span class="info-value">₦${
              costPerInfluencerPerPost?.toLocaleString() || "0"
            }</span>
          </div>
          <div class="info-row">
            <span class="info-label">Base Cost:</span>
            <span class="info-value">₦${
              totalBaseCost?.toLocaleString() || "0"
            }</span>
          </div>
          <div class="info-row">
            <span class="info-label">Platform Fee:</span>
            <span class="info-value">₦${
              platformFee?.toLocaleString() || "0"
            }</span>
          </div>
          <div class="info-row">
            <span class="info-label">Payment Status:</span>
            <span class="info-value">
              <span class="status-badge ${
                hasPaid ? "status-paid" : "status-pending"
              }">
                ${hasPaid ? "✅ Paid" : "⏳ Pending Payment"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="cost-highlight">
        <div class="cost-amount">Total Cost: ₦${
          totalCost?.toLocaleString() || "0"
        }</div>
      </div>
      
      <div class="timestamp">
        <p style="margin: 0;">
          <strong>Campaign Created:</strong> ${new Date().toLocaleString()}
        </p>
      </div>
      
      <p>The campaign is now live in the system and ready for influencer matching.</p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        This is an automated notification from the CaringSparks campaign system.
      </p>
    </div>
    
    <div class="footer">
      <p>CaringSparks Admin Notifications</p>
      <p>© ${new Date().getFullYear()} CaringSparks. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
    };

    // Brand Confirmation Email Template
    const brandCampaignMailOptions = {
      from: `"CaringSparks Team" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 Campaign Created Successfully - ${brandName} - CaringSparks`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Campaign Created Successfully</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: 'Source Sans Pro', Arial, sans-serif;
      line-height: 1.6;
      color: #475569;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .content {
      padding: 30px 20px;
    }
    .success-message {
      background-color: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .success-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .campaign-summary {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .info-label {
      font-weight: 600;
      color: #374151;
    }
    .info-value {
      color: #1f2937;
      font-weight: 500;
    }
    .platforms {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .platform-tag {
      background-color: #3b82f6;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .cost-summary {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .total-cost {
      font-size: 20px;
      font-weight: 700;
      color: #92400e;
      text-align: center;
      margin-top: 10px;
    }
    .next-steps {
      background-color: #eff6ff;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .cta-button {
      background-color: #4f46e5;
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
    .highlight {
      background-color: #ddd6fe;
      padding: 2px 6px;
      border-radius: 4px;
      color: #5b21b6;
      font-weight: 600;
    }
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-pending {
      background-color: #fef3c7;
      color: #92400e;
    }
    .status-paid {
      background-color: #dcfce7;
      color: #166534;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🎯 Campaign Created Successfully!</h1>
    </div>
    
    <div class="content">
      <div class="success-message">
        <div class="success-icon">✅</div>
        <h3 style="margin: 0; color: #10b981;">Your Campaign is Live!</h3>
        <p style="margin: 10px 0 0 0;">We're now matching you with the perfect influencers</p>
      </div>

      <p>Dear <span class="highlight">${brandName}</span>,</p>
      
      <p>Congratulations! Your influencer marketing campaign has been successfully created on CaringSparks. Our team is already working to connect you with relevant influencers who match your campaign requirements.</p>
      
      <div class="campaign-summary">
        <h3 style="margin-top: 0; color: #374151;">Campaign Summary</h3>
        <div class="info-row">
          <span class="info-label">Campaign Platforms:</span>
          <div class="platforms">
            ${platforms
              .map(
                (platform) => `<span class="platform-tag">${platform}</span>`
              )
              .join("")}
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">Target Location:</span>
          <span class="info-value">${location}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Influencers Needed:</span>
          <span class="info-value">${influencersMin} - ${influencersMax}</span>
        </div>
        ${
          followersRange
            ? `
        <div class="info-row">
          <span class="info-label">Followers Range:</span>
          <span class="info-value">${followersRange}</span>
        </div>
        `
            : ""
        }
        <div class="info-row">
          <span class="info-label">Payment Status:</span>
          <span class="info-value">
            <span class="status-badge ${
              hasPaid ? "status-paid" : "status-pending"
            }">
              ${hasPaid ? "✅ Paid" : "⏳ Pending Payment"}
            </span>
          </span>
        </div>
      </div>

      <div class="cost-summary">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">Investment Summary</h4>
        <div class="info-row">
          <span>Base Campaign Cost:</span>
          <span>₦${totalBaseCost?.toLocaleString() || "0"}</span>
        </div>
        <div class="info-row">
          <span>Platform Fee:</span>
          <span>₦${platformFee?.toLocaleString() || "0"}</span>
        </div>
        <div class="total-cost">Total: ₦${
          totalCost?.toLocaleString() || "0"
        }</div>
      </div>

      <div class="next-steps">
        <h4 style="margin-top: 0; color: #1e40af;">What Happens Next?</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Review & Approval:</strong> You'll receive influencer profiles within 24-48 hours</li>
          ${
            !hasPaid
              ? "<li><strong>Payment Processing:</strong> Complete payment to activate your campaign</li>"
              : ""
          }
          <li><strong>Campaign Launch:</strong> Once approved, your campaign goes live immediately</li>
          <li><strong>Real-time Tracking:</strong> Monitor performance through your dashboard</li>
        </ul>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${
            process.env.FRONTEND_URL || "https://caring-sparks.vercel.app"
          }/brands" class="cta-button">View Campaign Dashboard</a>
        </div>
      </div>

      ${
        !hasPaid
          ? `
      <div style="background-color: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #dc2626;"><strong>Payment Required:</strong> Please complete your payment to activate influencer matching.</p>
        <a href="${
          process.env.FRONTEND_URL || "https://caring-sparks.vercel.app"
        }/brands/campaigns" class="cta-button" style="background-color: #ef4444; margin-top: 10px;">Complete Payment</a>
      </div>
      `
          : ""
      }
      
      <p>Need help or have questions? Our support team is here to assist you every step of the way.</p>
      
      <p>Thank you for choosing CaringSparks for your influencer marketing needs!</p>
      
      <p style="margin-top: 30px;">
        Best regards,<br>
        <strong>The CaringSparks Team</strong>
      </p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        Campaign ID: ${savedCampaign._id}<br>
        Created: ${new Date().toLocaleString()}
      </p>
    </div>
    
    <div class="footer">
      <p><strong>CaringSparks</strong> - Connecting Brands with Authentic Voices</p>
      <p>Need help? Contact us at <a href="mailto:support@caringsparks.com">support@caringsparks.com</a></p>
      <p>© ${new Date().getFullYear()} CaringSparks. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
    };

    // Send both emails concurrently using Promise.allSettled
    const [adminResult, brandResult] = await Promise.allSettled([
      transporter.sendMail(adminCampaignMailOptions),
      transporter.sendMail(brandCampaignMailOptions),
    ]);

    // Log results
    if (adminResult.status === "fulfilled") {
      console.log(
        "✅ Admin notification email sent successfully:",
        adminResult.value.messageId
      );
    } else {
      console.error(
        "❌ Failed to send admin notification email:",
        adminResult.reason
      );
    }

    if (brandResult.status === "fulfilled") {
      console.log(
        "✅ Brand confirmation email sent successfully:",
        brandResult.value.messageId
      );
    } else {
      console.error(
        "❌ Failed to send brand confirmation email:",
        brandResult.reason
      );
    }

    return {
      adminEmailSent: adminResult.status === "fulfilled",
      brandEmailSent: brandResult.status === "fulfilled",
      adminEmailId:
        adminResult.status === "fulfilled" ? adminResult.value.messageId : null,
      brandEmailId:
        brandResult.status === "fulfilled" ? brandResult.value.messageId : null,
      errors: {
        admin:
          adminResult.status === "rejected"
            ? (adminResult.reason as Error)
            : null,
        brand:
          brandResult.status === "rejected"
            ? (brandResult.reason as Error)
            : null,
      },
    };
  } catch (error) {
    console.error("❌ Error in sendCampaignEmails function:", error);
    throw error;
  }
};
