import nodemailer from "nodemailer";

export const sendOnboardingEmail = async (to: string, password: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const adminOnboarding = {
    from: `"The•PR•God System" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: `Welcome to The•PR•God! Your Admin Account is Ready`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to The•PR•God</title>
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
      <h1>Welcome to The•PR•God!</h1>
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p>Your administrator account for the The•PR•God platform has been created. You can now log in to the admin dashboard using the credentials below:</p>
      
      <div class="brand-info">
        <h3 style="margin-top: 0; color: #374151;">Your Account Details:</h3>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${to}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Password:</span>
          <span class="info-value"><span class="highlight">${password}</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Platform:</span>
          <span class="info-value">The•PR•God Admin Dashboard</span>
        </div>
      </div>
      
      <p>For security, please change your password immediately after your first login.</p>
      
      <p>Thank you for your dedication and commitment to the The•PR•God team!</p>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
    
    <div class="footer">
      <p>The•PR•God Admin Notifications</p>
      <p>© ${new Date().getFullYear()} The•PR•God. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  };

  try {
    await transporter.sendMail(adminOnboarding);
  } catch (error: any) {
    console.log(error);
  }
};