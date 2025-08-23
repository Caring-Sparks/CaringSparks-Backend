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
