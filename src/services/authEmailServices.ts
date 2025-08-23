// Email service functions for password reset

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const companyName = "CaringSparks";
const frontendUrl = "https://caring-sparks.vercel.app/";

// Password Reset Email Template
const getPasswordResetEmailTemplate = (
  email: string,
  resetToken: string,
  role: string
) => {
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&role=${role}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - ${companyName}</title>
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
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
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

    .title {
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

    .reset-card {
      background-color: #ffffff;
      border: 2px solid #fecaca;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .reset-title {
      font-size: 18px;
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 15px;
      text-align: center;
    }

    .reset-info {
      background-color: #fef2f2;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }

    .reset-info p {
      margin: 5px 0;
      font-size: 14px;
      color: #991b1b;
    }

    .security-warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .security-warning p {
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
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
      margin-bottom: 15px;
    }

    .alternative-link {
      background-color: #f1f5f9;
      padding: 12px;
      border-radius: 6px;
      margin-top: 15px;
      word-break: break-all;
      font-family: monospace;
      font-size: 12px;
      color: #475569;
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
      .title {
        font-size: 22px !important;
      }
      .intro-text {
        font-size: 15px !important;
      }
      .cta-button {
        padding: 12px 20px !important;
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🔒</div>
      <h1 class="title">Password Reset Request</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p class="intro-text">
        🔑 We received a request to reset the password for your ${companyName} account.  
        If you made this request, please click the button below to create a new password.
      </p>
      
      <!-- Reset Card -->
      <div class="reset-card">
        <h2 class="reset-title">Reset Instructions</h2>
        
        <div class="reset-info">
          <p><strong>Account:</strong> ${email}</p>
          <p><strong>Role:</strong> ${
            role.charAt(0).toUpperCase() + role.slice(1)
          }</p>
          <p><strong>Valid for:</strong> 10 minutes from now</p>
        </div>
      </div>

      <!-- Security Warning -->
      <div class="security-warning">
        <p>
          <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, 
          please ignore this email. Your account is safe and no changes will be made.
        </p>
      </div>
      
      <!-- Call to Action -->
      <div class="cta-container">
        <a href="${resetUrl}" class="cta-button">
          Reset My Password
        </a>
        
        <p style="font-size: 13px; color: #64748b; margin-top: 15px;">
          This link will expire in 10 minutes for your security.
        </p>
        
        <div class="alternative-link">
          <strong>Can't click the button?</strong><br>
          Copy and paste this link into your browser:<br>
          ${resetUrl}
        </div>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        Need help? Contact our support team at support@caringsparks.com
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This password reset email was sent to ${email} from ${companyName}.
      </p>
      
      <div class="footer-links">
        <a href="${frontendUrl}">Login</a>
        <a href="mailto:support@caringsparks.com">Support</a>
        <a href="${frontendUrl}/privacy">Privacy Policy</a>
      </div>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} ${companyName}. All rights reserved.  
      </p>
    </div>
  </div>
</body>
</html>`;
};

// Password Reset Confirmation Email Template
const getPasswordResetConfirmationTemplate = (email: string) => {
  const loginUrl = `${frontendUrl}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Successfully Reset - ${companyName}</title>
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
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
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
      color: #16a34a;
    }

    .title {
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

    .success-card {
      background-color: #ffffff;
      border: 2px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .success-title {
      font-size: 18px;
      font-weight: 700;
      color: #16a34a;
      margin-bottom: 15px;
      text-align: center;
    }

    .success-info {
      background-color: #f0fdf4;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
      text-align: center;
    }

    .success-info p {
      margin: 5px 0;
      font-size: 14px;
      color: #15803d;
    }

    .security-tips {
      background-color: #e0f2fe;
      border-left: 4px solid #0ea5e9;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }

    .security-tips p {
      margin: 0;
      color: #0c4a6e;
      font-size: 13px;
      line-height: 1.5;
    }

    .security-tips ul {
      margin: 10px 0;
      padding-left: 20px;
      color: #0c4a6e;
      font-size: 13px;
    }

    .cta-container {
      text-align: center;
      margin: 30px 0;
    }

    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
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
      .title {
        font-size: 22px !important;
      }
      .intro-text {
        font-size: 15px !important;
      }
      .cta-button {
        padding: 12px 20px !important;
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">✓</div>
      <h1 class="title">Password Reset Successful</h1>
    </div>
    
    <!-- Content -->
    <div class="content">
      <p class="intro-text">
        🎉 Great news! Your ${companyName} account password has been successfully updated.  
        Your account is now secure with your new password.
      </p>
      
      <!-- Success Card -->
      <div class="success-card">
        <h2 class="success-title">Password Updated</h2>
        
        <div class="success-info">
          <p><strong>Account:</strong> ${email}</p>
          <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Status:</strong> ✅ Secure & Active</p>
        </div>
      </div>

      <!-- Security Tips -->
      <div class="security-tips">
        <p><strong>🛡️ Security Tips:</strong></p>
        <ul>
          <li>Keep your password private and secure</li>
          <li>Use a unique password for your ${companyName} account</li>
          <li>Consider enabling two-factor authentication</li>
          <li>Contact support immediately if you notice any suspicious activity</li>
        </ul>
      </div>
      
      <!-- Call to Action -->
      <div class="cta-container">
        <a href="${loginUrl}" class="cta-button">
          Login to Your Account
        </a>
        
        <p style="font-size: 13px; color: #64748b; margin-top: 15px;">
          You can now login with your new password.
        </p>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 20px;">
        If you didn't make this change or have concerns about your account security,  
        please contact our support team immediately at support@caringsparks.com
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">
        This confirmation email was sent to ${email} from ${companyName}.
      </p>
      
      <div class="footer-links">
        <a href="${loginUrl}">Login</a>
        <a href="mailto:support@caringsparks.com">Support</a>
        <a href="${frontendUrl}/privacy">Privacy Policy</a>
      </div>
      
      <p class="footer-text">
        © ${new Date().getFullYear()} ${companyName}. All rights reserved.  
      </p>
    </div>
  </div>
</body>
</html>`;
};

// Send password reset email with better error handling
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  role: string
): Promise<void> => {
  try {
    // Validate inputs
    if (!email || !resetToken || !role) {
      throw new Error(
        "Missing required parameters: email, resetToken, and role are required"
      );
    }

    const htmlContent = getPasswordResetEmailTemplate(email, resetToken, role);

    const mailOptions = {
      from: `"${companyName} Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🔒 Password Reset Request - ${companyName}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Password reset email sent successfully to ${email}:`,
      result.messageId
    );
  } catch (error: any) {
    console.error(`Failed to send password reset email to ${email}:`, error);

    // Provide more specific error messages
    if (error.message.includes("Missing credentials")) {
      throw new Error(
        "Email credentials not configured. Please check EMAIL_USER and EMAIL_PASS environment variables."
      );
    } else if (error.message.includes("Invalid login")) {
      throw new Error(
        "Invalid email credentials. Please check your Gmail app password."
      );
    } else if (error.message.includes("Connection timeout")) {
      throw new Error(
        "Email service connection timeout. Please try again later."
      );
    } else {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
};

// Send password reset confirmation email with better error handling
export const sendPasswordResetConfirmationEmail = async (
  email: string
): Promise<void> => {
  try {
    if (!email) {
      throw new Error("Email address is required");
    }

    const htmlContent = getPasswordResetConfirmationTemplate(email);

    const mailOptions = {
      from: `"${companyName} Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Password Successfully Reset - ${companyName}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `Password reset confirmation email sent successfully to ${email}:`,
      result.messageId
    );
  } catch (error: any) {
    console.error(
      `Failed to send password reset confirmation email to ${email}:`,
      error
    );

    // Provide more specific error messages
    if (error.message.includes("Missing credentials")) {
      throw new Error(
        "Email credentials not configured. Please check EMAIL_USER and EMAIL_PASS environment variables."
      );
    } else if (error.message.includes("Invalid login")) {
      throw new Error(
        "Invalid email credentials. Please check your Gmail app password."
      );
    } else {
      throw new Error(
        `Failed to send password reset confirmation email: ${error.message}`
      );
    }
  }
};
