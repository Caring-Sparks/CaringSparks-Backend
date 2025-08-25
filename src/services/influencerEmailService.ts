import nodemailer from "nodemailer";
import type { IInfluencer } from "../models/Influencer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendInfluencerWelcomeEmail = async (
  influencer: IInfluencer,
  plainPassword: string
) => {
  const companyName = "CaringSparks";
  const loginUrl = "https://caring-sparks.vercel.app/";

  const mailOptions = {
    from: `"CaringSparks - Influencer Program" <${process.env.EMAIL_USER}>`,
    to: influencer.email,
    subject: "Welcome to CaringSparks Influencer Program!",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName} Influencer Program</title>
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

    .info-card {
      background-color: #f0f9ff;
      border: 2px solid #bae6fd;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .info-title {
      font-size: 18px;
      font-weight: 700;
      color: #0369a1;
      margin-bottom: 15px;
      text-align: center;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .info-item {
      background-color: #ffffff;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #e0f2fe;
    }

    .info-label {
      font-weight: 600;
      color: #0369a1;
      font-size: 12px;
      display: block;
      margin-bottom: 4px;
    }

    .info-value {
      color: #1e293b;
      font-weight: 500;
      font-size: 14px;
    }

    .platforms-card {
      background-color: #f0fdf4;
      border: 2px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .platforms-title {
      font-size: 18px;
      font-weight: 700;
      color: #166534;
      margin-bottom: 15px;
      text-align: center;
    }

    .platform-item {
      background-color: #ffffff;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 10px;
      border: 1px solid #dcfce7;
    }

    .platform-name {
      font-weight: 700;
      color: #166534;
      font-size: 14px;
      margin-bottom: 5px;
    }

    .platform-stats {
      font-size: 13px;
      color: #374151;
      margin-bottom: 3px;
    }

    .platform-url {
      font-size: 12px;
      color: #4f46e5;
      word-break: break-all;
    }

    .status-badge {
      display: inline-block;
      background-color: #fbbf24;
      color: #92400e;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
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
      .info-grid {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🌟</div>
      <h1 class="welcome-title">Welcome to CaringSparks!</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p class="intro-text">
        🎉 Congratulations ${
          influencer.name
        }! Your influencer application has been received.  
        We're excited to potentially have you join our influencer program and help brands 
        connect with your amazing audience.
      </p>
      
      <!-- Credentials Card -->
      <div class="credentials-card">
        <h2 class="credentials-title">Your Login Credentials</h2>
        
        <div class="credential-row">
          <span class="credential-label">Email</span>
          <span class="credential-value">${influencer.email}</span>
        </div>
        
        <div class="credential-row">
          <span class="credential-label">Password</span>
          <span class="credential-value">${plainPassword}</span>
        </div>
        
        <div class="credential-row">
          <span class="credential-label">Status</span>
          <span class="credential-value">
            <span class="status-badge">${influencer.status}</span>
          </span>
        </div>
      </div>

      <!-- Application Summary -->
      <div class="info-card">
        <h2 class="info-title">Application Summary</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Full Name</span>
            <span class="info-value">${influencer.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Location</span>
            <span class="info-value">${
              influencer.location || "Not specified"
            }</span>
          </div>
          <div class="info-item">
            <span class="info-label">Phone</span>
            <span class="info-value">${
              influencer.phone || "Not provided"
            }</span>
          </div>
          <div class="info-item">
            <span class="info-label">WhatsApp</span>
            <span class="info-value">${
              influencer.whatsapp || "Not provided"
            }</span>
          </div>
        </div>
        
        <div class="credential-row" style="margin-top: 15px;">
          <span class="credential-label">Content Niches</span>
          <span class="credential-value" style="background-color: #ffffff; border: 1px solid #e0f2fe;">
            ${
              influencer.niches && influencer.niches.length > 0
                ? influencer.niches.join(" • ")
                : "Not specified"
            }
          </span>
        </div>
      </div>

      ${
        influencer.instagram ||
        influencer.twitter ||
        influencer.tiktok ||
        influencer.facebook ||
        influencer.linkedin ||
        influencer.threads ||
        influencer.discord ||
        influencer.youtube
          ? `
      <!-- Social Media Platforms -->
      <div class="platforms-card">
        <h2 class="platforms-title">Your Social Media Platforms</h2>
        
        ${
          influencer.instagram
            ? `
        <div class="platform-item">
          <div class="platform-name">📷 Instagram</div>
          <div class="platform-stats">${
            influencer.instagram.followers || "N/A"
          } followers • ${
                influencer.instagram.impressions || "N/A"
              } impressions</div>
          <div class="platform-url">${
            influencer.instagram.url || "URL not provided"
          }</div>
        </div>
        `
            : ""
        }

               ${
                 influencer.facebook
                   ? `
        <div class="platform-item">
<span class="platform-name">📘 Facebook</span>
          <div class="platform-stats">${
            influencer.facebook.followers || "N/A"
          } followers • ${
                       influencer.facebook.impressions || "N/A"
                     } impressions</div>
          <div class="platform-url">${
            influencer.facebook.url || "URL not provided"
          }</div>
        </div>
        `
                   : ""
               }
        
        ${
          influencer.twitter
            ? `
        <div class="platform-item">
          <div class="platform-name">🐦 Twitter</div>
          <div class="platform-stats">${
            influencer.twitter.followers || "N/A"
          } followers • ${
                influencer.twitter.impressions || "N/A"
              } impressions</div>
          <div class="platform-url">${
            influencer.twitter.url || "URL not provided"
          }</div>
        </div>
        `
            : ""
        }
        
        ${
          influencer.tiktok
            ? `
        <div class="platform-item">
          <div class="platform-name">🎵 TikTok</div>
          <div class="platform-stats">${
            influencer.tiktok.followers || "N/A"
          } followers • ${
                influencer.tiktok.impressions || "N/A"
              } impressions</div>
          <div class="platform-url">${
            influencer.tiktok.url || "URL not provided"
          }</div>
        </div>
        `
            : ""
        }
        
        ${
          influencer.youtube
            ? `
        <div class="platform-item">
          <div class="platform-name">📺 YouTube</div>
          <div class="platform-stats">${
            influencer.youtube.followers || "N/A"
          } followers • ${
                influencer.youtube.impressions || "N/A"
              } impressions</div>
          <div class="platform-url">${
            influencer.youtube.url || "URL not provided"
          }</div>
        </div>
        `
            : ""
        }
                ${
                  influencer.linkedin
                    ? `
        <div class="platform-item">
          <div class="platform-name">💼 LinkedIn</div>
          <div class="platform-stats">${
            influencer.linkedin.followers || "N/A"
          } followers • ${
                        influencer.linkedin.impressions || "N/A"
                      } impressions</div>
          <div class="platform-url">${
            influencer.linkedin.url || "URL not provided"
          }</div>
        </div>
        `
                    : ""
                }
                ${
                  influencer.threads
                    ? `
        <div class="platform-item">
          <div class="platform-name">🧵 Threads</div>
          <div class="platform-stats">${
            influencer.threads.followers || "N/A"
          } followers • ${
                        influencer.threads.impressions || "N/A"
                      } impressions</div>
          <div class="platform-url">${
            influencer.threads.url || "URL not provided"
          }</div>
        </div>
        `
                    : ""
                }
                ${
                  influencer.discord
                    ? `
        <div class="platform-item">
          <div class="platform-name">🎮 Discord</div>
          <div class="platform-stats">${
            influencer.discord.followers || "N/A"
          } followers • ${
                        influencer.discord.impressions || "N/A"
                      } impressions</div>
          <div class="platform-url">${
            influencer.discord.url || "URL not provided"
          }</div>
        </div>
        `
                    : ""
                }
                                ${
                                  influencer.snapchat
                                    ? `
        <div class="platform-item">
          <div class="platform-name">👻Snapchat</div>
          <div class="platform-stats">${
            influencer.snapchat.followers || "N/A"
          } followers • ${
                                        influencer.snapchat.impressions || "N/A"
                                      } impressions</div>
          <div class="platform-url">${
            influencer.snapchat.url || "URL not provided"
          }</div>
        </div>
        `
                                    : ""
                                }
      </div>
      `
          : ""
      }

      <!-- Security Note -->
      <div class="security-note">
        <p>
          <strong>⏳ Next Steps:</strong> We'll review your application within 2-3 business days. 
          Please change your password after your first login and keep your credentials secure.
        </p>
      </div>
      
      <!-- Call to Action -->
      <div class="cta-container">
        <a href="${loginUrl}" class="cta-button">
          Access Your Influencer Dashboard
        </a>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        Ready to collaborate with amazing brands and monetize your content?  
        Our support team is here to help you succeed.
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This email was sent to ${
          influencer.email
        } because you applied to our influencer program.
      </p>
      
      <div class="footer-links">
        <a href="${loginUrl}">Login</a>
        <a href="mailto:support@caringsparks.com">Support</a>
        <a href="https://caringsparks.com/privacy">Privacy Policy</a>
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

  await transporter.sendMail(mailOptions);
};

export const sendAdminNotificationEmail = async (influencer: IInfluencer) => {
  const mailOptions = {
    from: `"CaringSparks System" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: "🌟 New Influencer Application - CaringSparks",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Influencer Application</title>
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

    .logo {
      width: 50px;
      height: 50px;
      background-color: #ffffff;
      border-radius: 12px;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .content {
      padding: 30px 20px;
    }

    .alert-banner {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 25px;
      font-weight: 600;
    }

    .info-card {
      background-color: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: #4f46e5;
      margin-bottom: 15px;
      text-align: center;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 15px;
    }

    .info-item {
      background-color: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .info-label {
      font-weight: 600;
      color: #64748b;
      font-size: 12px;
      display: block;
      margin-bottom: 4px;
    }

    .info-value {
      color: #1e293b;
      font-weight: 500;
      font-size: 14px;
      word-break: break-word;
    }

    .platforms-card {
      background-color: #f0fdf4;
      border: 2px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .platforms-title {
      font-size: 18px;
      font-weight: 700;
      color: #166534;
      margin-bottom: 15px;
      text-align: center;
    }

    .platform-item {
      background-color: #ffffff;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 12px;
      border: 1px solid #dcfce7;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .platform-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .platform-name {
      font-weight: 700;
      color: #166534;
      font-size: 16px;
    }

    .platform-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .stat-item {
      background-color: #f0fdf4;
      padding: 6px 10px;
      border-radius: 4px;
      text-align: center;
    }

    .stat-number {
      font-weight: 700;
      color: #166534;
      font-size: 14px;
    }

    .stat-label {
      font-size: 11px;
      color: #65a30d;
      text-transform: uppercase;
    }

    .platform-url {
      background-color: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-size: 12px;
      color: #4f46e5;
      word-break: break-all;
    }

    .audience-card {
      background-color: #fef3c7;
      border: 2px solid #fcd34d;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .audience-title {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 15px;
      text-align: center;
    }

    .demographics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .demo-item {
      background-color: #ffffff;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #fde68a;
    }

    .demo-value {
      font-size: 18px;
      font-weight: 700;
      color: #92400e;
    }

    .demo-label {
      font-size: 12px;
      color: #a16207;
      margin-top: 4px;
    }

    .timestamp-card {
      background-color: #ddd6fe;
      border-left: 4px solid #8b5cf6;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .timestamp-card p {
      margin: 0;
      color: #5b21b6;
      font-weight: 600;
    }

    .action-note {
      background-color: #fef2f2;
      border: 2px solid #fecaca;
      border-radius: 12px;
      padding: 20px;
      margin: 25px 0;
      text-align: center;
    }

    .action-note p {
      margin: 0;
      color: #dc2626;
      font-weight: 600;
      font-size: 16px;
    }

    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }

    .footer-text {
      color: #64748b;
      font-size: 14px;
      margin: 5px 0;
    }

    /* Mobile responsiveness */
    @media only screen and (max-width: 600px) {
      .info-grid, .demographics-grid {
        grid-template-columns: 1fr !important;
      }
      .platform-stats {
        grid-template-columns: 1fr !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">🌟</div>
      <h1>New Influencer Application</h1>
    </div>
    
    <div class="content">
      <div class="alert-banner">
        📋 Action Required: New Application Review
      </div>
      
      <p>A new influencer has submitted an application to join the CaringSparks platform. Please review the details below and update their status accordingly.</p>
      
      <!-- Contact Information -->
      <div class="info-card">
        <h3 class="card-title">👤 Contact Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Full Name</span>
            <span class="info-value">${influencer.name}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Email Address</span>
            <span class="info-value">${influencer.email}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Phone Number</span>
            <span class="info-value">${
              influencer.phone || "Not provided"
            }</span>
          </div>
          <div class="info-item">
            <span class="info-label">WhatsApp</span>
            <span class="info-value">${
              influencer.whatsapp || "Not provided"
            }</span>
          </div>
          <div class="info-item">
            <span class="info-label">Location</span>
            <span class="info-value">${
              influencer.location || "Not specified"
            }</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status</span>
            <span class="info-value" style="background: #fbbf24; color: #ffffff; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">
              ${influencer.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div class="info-item" style="margin-top: 12px;">
          <span class="info-label">Content Niches</span>
          <span class="info-value">${
            influencer.niches && influencer.niches.length > 0
              ? influencer.niches.join(" • ")
              : "Not specified"
          }</span>
        </div>
      </div>
      
      ${
        [
          "instagram",
          "twitter",
          "tiktok",
          "youtube",
          "facebook",
          "linkedin",
          "threads",
          "discord",
          "snapchat",
        ].some((platform) => influencer[platform as keyof IInfluencer])
          ? `
      <!-- Social Media Platforms -->
      <div class="platforms-card">
        <h3 class="platforms-title">📱 Social Media Platforms</h3>
        
        ${
          influencer.instagram
            ? `
        <div class="platform-item">
          <div class="platform-header">
            <span class="platform-name">📷 Instagram</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.instagram.followers || "N/A"
              }</div>
              <div class="stat-label">Followers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.instagram.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.instagram.url || "URL not provided"
          }</div>
        </div>
        `
            : ""
        }

               ${
                 influencer.facebook
                   ? `
        <div class="platform-item">
          <div class="platform-header">
<span class="platform-name">📘 Facebook</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.facebook.followers || "N/A"
              }</div>
              <div class="stat-label">Followers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.facebook.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.facebook.url || "URL not provided"
          }</div>
        </div>
        `
                   : ""
               }
        
        ${
          influencer.twitter
            ? `
        <div class="platform-item">
          <div class="platform-header">
            <span class="platform-name">🐦 Twitter</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.twitter.followers || "N/A"
              }</div>
              <div class="stat-label">Followers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.twitter.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.twitter.url || "URL not provided"
          }</div>
        </div>
        `
            : ""
        }
        
        ${
          influencer.tiktok
            ? `
        <div class="platform-item">
          <div class="platform-header">
            <span class="platform-name">🎵 TikTok</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.tiktok.followers || "N/A"
              }</div>
              <div class="stat-label">Followers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.tiktok.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.tiktok.url || "URL not provided"
          }</div>
        </div>
        `
            : ""
        }
        
        ${
          influencer.youtube
            ? `
        <div class="platform-item">
          <div class="platform-header">
            <span class="platform-name">📺 YouTube</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.youtube.followers || "N/A"
              }</div>
              <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.youtube.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.youtube.url || "URL not provided"
          }</div>
        </div>
        `
            : ""
        }
                ${
                  influencer.linkedin
                    ? `
        <div class="platform-item">
          <div class="platform-header">
            <span class="platform-name">💼 Linkedin</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.linkedin.followers || "N/A"
              }</div>
              <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.linkedin.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.linkedin.url || "URL not provided"
          }</div>
        </div>
        `
                    : ""
                }
                ${
                  influencer.discord
                    ? `
        <div class="platform-item">
          <div class="platform-header">
            <span class="platform-name">🎮 Discord</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.discord.followers || "N/A"
              }</div>
              <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.discord.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.discord.url || "URL not provided"
          }</div>
        </div>
        `
                    : ""
                }
                ${
                  influencer.threads
                    ? `
        <div class="platform-item">
          <div class="platform-header">
            <span class="platform-name">🧵 Threads</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.threads.followers || "N/A"
              }</div>
              <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.threads.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.threads.url || "URL not provided"
          }</div>
        </div>
        `
                    : ""
                }
                                ${
                                  influencer.snapchat
                                    ? `
        <div class="platform-item">
          <div class="platform-header">
            <span class="platform-name">👻 Snapchat</span>
          </div>
          <div class="platform-stats">
            <div class="stat-item">
              <div class="stat-number">${
                influencer.snapchat.followers || "N/A"
              }</div>
              <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${
                influencer.snapchat.impressions || "N/A"
              }</div>
              <div class="stat-label">Impressions</div>
            </div>
          </div>
          <div class="platform-url">${
            influencer.snapchat.url || "URL not provided"
          }</div>
        </div>
        `
                                    : ""
                                }
      </div>
      `
          : ""
      }
      
      ${
        influencer.audienceLocation ||
        influencer.malePercentage ||
        influencer.femalePercentage
          ? `
      <!-- Audience Demographics -->
      <div class="audience-card">
        <h3 class="audience-title">👥 Audience Demographics</h3>
        <div class="demographics-grid">
          ${
            influencer.audienceLocation
              ? `
          <div class="demo-item">
            <div class="demo-value">🌍</div>
            <div class="demo-label">Location</div>
            <div style="font-weight: 600; color: #92400e; margin-top: 4px; font-size: 14px;">
              ${influencer.audienceLocation}
            </div>
          </div>
          `
              : ""
          }
          ${
            influencer.malePercentage
              ? `
          <div class="demo-item">
            <div class="demo-value">${influencer.malePercentage}%</div>
            <div class="demo-label">Male Audience</div>
          </div>
          `
              : ""
          }
          ${
            influencer.femalePercentage
              ? `
          <div class="demo-item">
            <div class="demo-value">${influencer.femalePercentage}%</div>
            <div class="demo-label">Female Audience</div>
          </div>
          `
              : ""
          }
        </div>
      </div>
      `
          : ""
      }
      
      <!-- Timestamp -->
      <div class="timestamp-card">
        <p>
          <strong>⏰ Application Submitted:</strong> ${new Date().toLocaleString(
            "en-US",
            {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            }
          )}
        </p>
      </div>
      
      <!-- Action Required -->
      <div class="action-note">
        <p>
          🚀 Please review this application and update the influencer's status in the admin dashboard.
        </p>
      </div>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; text-align: center;">
        This is an automated notification from the CaringSparks influencer application system.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text"><strong>CaringSparks Admin Notifications</strong></p>
      <p class="footer-text">© ${new Date().getFullYear()} CaringSparks. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  };

  await transporter.sendMail(mailOptions);
};
