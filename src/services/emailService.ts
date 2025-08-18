import nodemailer from "nodemailer";

export const sendBrandEmail = async (to: string, password: string) => {
  const companyName = "CaringSparks";
  const loginUrl = "CaringSparks"; //replace after deployment

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"CaringSparks - " <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to CaringSparks",
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
      <div class="logo"></div>
      <h1 class="welcome-title">Welcome to CaringSparks!</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p class="intro-text">
        🎉 Congratulations! Your brand has officially joined our platform.  
        We’re excited to help you connect with audiences, run impactful campaigns, 
        and grow your brand presence with us.
      </p>
      
      <!-- Credentials Card -->
      <div class="credentials-card">
        <h2 class="credentials-title">Your Login Credentials</h2>
        
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
        This email was sent to ${to} because your brand was registered on CaringSparks.
      </p>
      
      <div class="footer-links">
        <a href="${loginUrl}">Login</a>
        <a href="mailto:support@yourapp.com">Support</a>
        <a href="https://yourapp.com/privacy">Privacy Policy</a>
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
