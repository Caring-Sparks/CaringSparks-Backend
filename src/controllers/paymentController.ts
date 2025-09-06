// routes/verify-payment.ts
import { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import Campaign from "../models/Campaign";

// Types for Flutterwave API response
interface FlutterwaveCustomer {
  id: number;
  name: string;
  phone_number?: string;
  email: string;
  created_at: string;
}

interface FlutterwavePaymentData {
  id: number;
  tx_ref: string;
  flw_ref: string;
  device_fingerprint: string;
  amount: number;
  currency: string;
  charged_amount: number;
  app_fee: number;
  merchant_fee: number;
  processor_response: string;
  auth_model: string;
  ip: string;
  narration: string;
  status: string;
  payment_type: string;
  created_at: string;
  account_id: number;
  customer: FlutterwaveCustomer;
  card?: {
    first_6digits: string;
    last_4digits: string;
    issuer: string;
    country: string;
    type: string;
    token: string;
    expiry: string;
  };
}

interface FlutterwaveVerificationResponse {
  status: string;
  message: string;
  data: FlutterwavePaymentData;
}

interface VerificationRequest extends Request {
  body: {
    transactionId: string;
    campaignId: string;
  };
}

interface PaymentStatusQuery extends Request {
  query: {
    transactionId?: string;
  };
}

interface PaymentVerificationResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    transactionId: number;
    reference: string;
    amount: number;
    currency: string;
    customerEmail: string;
    paymentMethod: string;
    status: string;
    chargedAmount: number;
    processorResponse: string;
    campaignId: string;
    paymentDate: string;
  };
  status?: string;
}

interface PaymentStatusResponse {
  success: boolean;
  error?: string;
  message?: string;
  data?: {
    status: string;
    amount?: number;
    currency?: string;
    reference?: string;
  };
}

// POST /api/verify-payment - Verify payment transaction
export const verifyPayment = async (
  req: VerificationRequest,
  res: Response<PaymentVerificationResponse>
): Promise<void> => {
  try {
    const { transactionId, campaignId } = req.body;

    // Validate input
    if (!transactionId || !campaignId) {
      res.status(400).json({
        success: false,
        error: "Transaction ID and Campaign ID are required",
      });
      return;
    }

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      console.error("FLUTTERWAVE_SECRET_KEY environment variable is not set");
      res.status(500).json({
        success: false,
        error: "Payment service configuration error",
      });
      return;
    }

    // Check if campaign exists before verification
    const existingCampaign = await Campaign.findById(campaignId);
    if (!existingCampaign) {
      res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
      return;
    }

    // Check if payment is already verified
    if (existingCampaign.hasPaid) {
      res.status(400).json({
        success: false,
        error: "Payment has already been verified for this campaign",
        message: "This campaign payment has already been processed",
      });
      return;
    }

    // Verify with Flutterwave API
    const response = await axios.get<FlutterwaveVerificationResponse>(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const verificationData = response.data;

    if (
      verificationData.status === "success" &&
      verificationData.data.status === "successful"
    ) {
      const paymentData = verificationData.data;
      const currentDate = new Date();

      // Update Campaign with payment details
      const updatedCampaign = await Campaign.findByIdAndUpdate(
        campaignId,
        {
          hasPaid: true,
          paymentReference: paymentData.tx_ref,
          paymentDate: currentDate.toISOString(),
          paymentDetails: {
            flutterwaveTransactionId: paymentData.id,
            amount: paymentData.amount,
            currency: paymentData.currency,
            customerEmail: paymentData.customer.email,
            paymentMethod: paymentData.payment_type,
            processorResponse: paymentData.processor_response,
            chargedAmount: paymentData.charged_amount,
            completedAt: new Date(paymentData.created_at),
          },
        },
        { new: true }
      );

      if (!updatedCampaign) {
        res.status(404).json({
          success: false,
          error: "Failed to update campaign with payment details",
        });
        return;
      }

      // Return properly formatted response
      res.status(200).json({
        success: true,
        message: "Payment verified and campaign updated successfully",
        data: {
          transactionId: paymentData.id,
          reference: paymentData.tx_ref,
          amount: paymentData.amount,
          currency: paymentData.currency,
          customerEmail: paymentData.customer.email,
          paymentMethod: paymentData.payment_type,
          status: paymentData.status,
          chargedAmount: paymentData.charged_amount,
          processorResponse: paymentData.processor_response,
          campaignId: campaignId,
          paymentDate: currentDate.toISOString(),
        },
      });
    } else {
      // Handle failed verification
      res.status(400).json({
        success: false,
        error: "Payment verification failed",
        status: verificationData.data?.status || "unknown",
        message: verificationData.message || "Payment not successful",
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);

    let errorMessage = "Unknown error occurred";
    let statusCode = 500;

    if (error instanceof AxiosError) {
      if (error.response) {
        const responseData = error.response.data;
        errorMessage =
          responseData?.message ||
          `Flutterwave API error: ${error.response.status} ${error.response.statusText}`;
        statusCode = error.response.status >= 500 ? 500 : 400;

        // Handle specific Flutterwave error cases
        if (error.response.status === 404) {
          errorMessage = "Transaction not found";
        } else if (error.response.status === 401) {
          errorMessage = "Invalid API credentials";
        }
      } else if (error.request) {
        errorMessage = "Network error: Unable to reach Flutterwave API";
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: "Payment verification failed",
      message: errorMessage,
    });
  }
};

// GET /api/verify-payment - Check payment status
export const getPaymentStatus = async (
  req: PaymentStatusQuery,
  res: Response<PaymentStatusResponse>
): Promise<void> => {
  try {
    const { transactionId } = req.query;

    if (!transactionId || typeof transactionId !== "string") {
      res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
      return;
    }

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      console.error("FLUTTERWAVE_SECRET_KEY environment variable is not set");
      res.status(500).json({
        success: false,
        error: "Payment service configuration error",
      });
      return;
    }

    const response = await axios.get<FlutterwaveVerificationResponse>(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const verificationData = response.data;

    res.status(200).json({
      success: true,
      message: "Payment status retrieved successfully",
      data: {
        status: verificationData.data?.status || "unknown",
        amount: verificationData.data?.amount,
        currency: verificationData.data?.currency,
        reference: verificationData.data?.tx_ref,
      },
    });
  } catch (error) {
    console.error("Payment status check error:", error);

    let errorMessage = "Unknown error occurred";
    let statusCode = 500;

    if (error instanceof AxiosError) {
      if (error.response) {
        const responseData = error.response.data;
        errorMessage =
          responseData?.message ||
          `Flutterwave API error: ${error.response.status} ${error.response.statusText}`;
        statusCode = error.response.status >= 500 ? 500 : 400;

        if (error.response.status === 404) {
          errorMessage = "Transaction not found";
        } else if (error.response.status === 401) {
          errorMessage = "Invalid API credentials";
        }
      } else if (error.request) {
        errorMessage = "Network error: Unable to reach Flutterwave API";
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: "Failed to check payment status",
      message: errorMessage,
    });
  }
};

// Helper function to get campaign payment details
export const getCampaignPaymentDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { campaignId } = req.params;

    if (!campaignId) {
      res.status(400).json({
        success: false,
        error: "Campaign ID is required",
      });
      return;
    }

    const campaign = await Campaign.findById(campaignId).select(
      "hasPaid paymentReference paymentDate paymentDetails totalCost"
    );

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        hasPaid: campaign.hasPaid,
        paymentReference: campaign.paymentReference,
        paymentDate: campaign.paymentDate,
        paymentDetails: campaign.paymentDetails,
        totalCost: campaign.totalCost,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign payment details:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch campaign payment details",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Export route configuration for easy setup
export const paymentRoutes = {
  verifyPayment,
  getPaymentStatus,
  getCampaignPaymentDetails,
};
