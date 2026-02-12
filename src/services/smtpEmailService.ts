import nodemailer from "nodemailer";

export const sendSmtp = async (
  name: string,
  email: string,
  message: string,
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const smtpMail = {
    from: `"The•PR•God System" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `New Contact Form Submission - ${name}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
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
    .contact-info {
      background-color: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-row {
      margin-bottom: 12px;
    }
    .info-label {
      font-weight: 600;
      color: #374151;
      display: inline-block;
      width: 100px;
    }
    .info-value {
      color: #1f2937;
      font-weight: 500;
    }
    .message-box {
      background-color: #ffffff;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .message-label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
      display: block;
    }
    .message-content {
      color: #1f2937;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .timestamp {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
      font-size: 14px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .badge {
      display: inline-block;
      background-color: #ddd6fe;
      padding: 4px 10px;
      border-radius: 12px;
      color: #5b21b6;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
    </div>
    
    <div class="content">
      <div class="badge">New Inquiry</div>
      
      <p>You've received a new message through The•PR•God website contact form.</p>
      
      <div class="contact-info">
        <h3 style="margin-top: 0; color: #374151;">Contact Details:</h3>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${email}</span>
        </div>
      </div>
      
      <div class="message-box">
        <span class="message-label">Message:</span>
        <div class="message-content">${message}</div>
      </div>
      
      <div class="timestamp">
        <strong>Received:</strong> ${new Date().toLocaleString("en-US", {
          dateStyle: "full",
          timeStyle: "short",
        })}
      </div>
      
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
        This is an automated notification from your website contact form.
      </p>
    </div>
    
    <div class="footer">
      <p>The•PR•God Contact Form Notifications</p>
      <p>© ${new Date().getFullYear()} The•PR•God. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
  };

  try {
    await transporter.sendMail(smtpMail);
  } catch (error: any) {
    console.log(error);
  }
};
