import twilio from "twilio";

interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string[];
}

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Initialize Twilio client
const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not set in environment variables");
  }

  return twilio(accountSid, authToken);
};

const getFromNumber = () => {
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!fromNumber) {
    throw new Error("Twilio WhatsApp number is not set");
  }

  return fromNumber.startsWith("whatsapp:")
    ? fromNumber
    : `whatsapp:${fromNumber}`;
};

const formatPhoneNumber = (phoneNumber: string) => {
  return phoneNumber.startsWith("whatsapp:")
    ? phoneNumber
    : `whatsapp:${phoneNumber}`;
};

export const sendWhatsAppMessage = async (
  to: string,
  body: string,
  mediaUrl?: string[]
): Promise<WhatsAppResponse> => {
  try {
    const client = getTwilioClient();
    const from = getFromNumber();
    const formattedTo = formatPhoneNumber(to);

    const messageOptions: any = {
      from,
      to: formattedTo,
      body,
    };

    if (mediaUrl && mediaUrl.length > 0) {
      messageOptions.mediaUrl = mediaUrl;
    }

    const message = await client.messages.create(messageOptions);

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error("WhatsApp send error:", error);
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp message",
    };
  }
};

export const sendTemplateMessage = async (
  to: string,
  contentSid: string,
  contentVariables?: Record<string, string>
): Promise<WhatsAppResponse> => {
  try {
    const client = getTwilioClient();
    const from = getFromNumber();
    const formattedTo = formatPhoneNumber(to);

    const messageOptions: any = {
      from,
      to: formattedTo,
      contentSid,
    };

    if (contentVariables) {
      messageOptions.contentVariables = JSON.stringify(contentVariables);
    }

    const message = await client.messages.create(messageOptions);

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error: any) {
    console.error("WhatsApp template send error:", error);
    return {
      success: false,
      error: error.message || "Failed to send WhatsApp template message",
    };
  }
};

export const sendBulkWhatsAppMessages = async (
  messages: WhatsAppMessage[]
): Promise<WhatsAppResponse[]> => {
  const results = await Promise.allSettled(
    messages.map((msg) => sendWhatsAppMessage(msg.to, msg.body, msg.mediaUrl))
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason?.message || "Failed to send message",
      };
    }
  });
};

export const getWhatsAppMessageStatus = async (messageId: string) => {
  try {
    const client = getTwilioClient();
    const message = await client.messages(messageId).fetch();

    return {
      success: true,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to fetch message status",
    };
  }
};

export const sendCampaignAssignmentWhatsApp = async (
  phoneNumber: string,
  influencerName: string,
  campaign: any
) => {
  const message = `🎉 *New Campaign Assignment!*

Hi ${influencerName}!

You've been assigned to a new campaign:

📋 *${campaign.brandName}*

Please log in to your dashboard to review the campaign details and accept the assignment.

Thank you for being part of CaringSparks! 🌟`;

  return await sendWhatsAppMessage(phoneNumber, message);
};

export const sendCampaignResponseWhatsApp = async (
  phoneNumber: string,
  brandName: string,
  influencerName: string,
  campaignName: string,
  status: "accepted" | "declined",
  responseMessage?: string
) => {
  const statusEmoji = status === "accepted" ? "✅" : "❌";
  const statusText = status === "accepted" ? "accepted" : "declined";

  const message = `${statusEmoji} *Campaign Response*

Hi ${brandName},

${influencerName} has *${statusText}* your campaign assignment.

📋 *Campaign:* ${campaignName}
👤 *Influencer:* ${influencerName}
${responseMessage ? `\n💬 *Message:* ${responseMessage}` : ""}

${
  status === "accepted"
    ? "Great news! You can now proceed with this influencer."
    : "You may want to assign another influencer to this campaign."
}

Check your dashboard for more details.`;

  return await sendWhatsAppMessage(phoneNumber, message);
};

export const sendDeliverablesSubmissionWhatsApp = async (
  phoneNumber: string,
  brandName: string,
  influencerName: string,
  campaignName: string,
  deliverableCount: number,
  requiredCount: number
) => {
  const message = `📦 *Deliverables Submitted!*

Hi ${brandName},

${influencerName} has completed and submitted all deliverables for your campaign.

📋 *Campaign:* ${campaignName}
👤 *Influencer:* ${influencerName}
✅ *Submitted:* ${deliverableCount}/${requiredCount} posts

All required deliverables have been submitted. Please review and approve them in your dashboard.

Great work from your influencer! 🎉`;

  return await sendWhatsAppMessage(phoneNumber, message);
};
