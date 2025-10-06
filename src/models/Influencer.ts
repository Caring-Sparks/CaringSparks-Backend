import mongoose, { Schema, type Document } from "mongoose";

// Social media platform data interface
export interface PlatformData {
  followers: string;
  url: string;
  impressions: string;
  proofUrl?: string;
}

// Bank account details interface
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified?: boolean;
}

// Crypto wallet details interface
export interface CryptoDetails {
  walletAddress: string;
  network: string;
  walletType: string;
  isVerified?: boolean;
}

// Main influencer interface
export interface IInfluencer extends Document {
  name: string;
  email: string;
  phone: string;
  password: string;
  whatsapp: string;
  location: string;
  niches: string[];
  audienceLocation?: string;
  malePercentage?: string;
  femalePercentage?: string;
  audienceProofUrl?: string;

  // Payment details
  paymentMethod?: "bank" | "crypto";
  bankDetails?: BankDetails;
  hasBankDetails: boolean;
  cryptoDetails?: CryptoDetails;
  hasCryptoDetails: boolean;

  // Dynamic platform data
  instagram?: PlatformData;
  twitter?: PlatformData;
  tiktok?: PlatformData;
  youtube?: PlatformData;
  facebook?: PlatformData;
  linkedin?: PlatformData;
  discord?: PlatformData;
  threads?: PlatformData;
  snapchat?: PlatformData;

  // Calculated earnings fields (from frontend)
  followerFee?: number;
  impressionFee?: number;
  locationFee?: number;
  nicheFee?: number;
  earningsPerPost?: number;
  earningsPerPostNaira?: number;
  maxMonthlyEarnings?: number;
  maxMonthlyEarningsNaira?: number;
  followersCount?: number;

  // Legacy fields (keeping for backward compatibility)
  amountPerPost?: string;
  amountPerMonth?: string;

  // Metadata
  status: "pending" | "approved" | "rejected";
  emailSent: boolean;
  isValidated: boolean;

  passwordResetToken: string;
  passwordResetExpires: string;
}

// Validate niche options
const validNiches = [
  "Fashion and Lifestyle",
  "Lifestyle",
  "Tech",
  "Food",
  "Travel",
  "Fitness",
  "Beauty",
  "Gaming",
  "Music",
  "Art",
];

// Valid crypto networks
const validCryptoNetworks = [
  "Bitcoin (BTC)",
  "Ethereum (ETH)",
  "Binance Smart Chain (BSC)",
  "Tron (TRX)",
  "Polygon (MATIC)",
  "Solana (SOL)",
  "USDT (TRC20)",
  "USDT (ERC20)",
  "USDT (BSC)",
  "USDC",
];

// Mongoose schema
const InfluencerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    whatsapp: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    niches: [
      {
        type: String,
        required: true,
        enum: {
          values: validNiches,
          message: "Invalid niche selected",
        },
      },
    ],
    audienceLocation: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    malePercentage: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          const num = parseFloat(v);
          return !isNaN(num) && num >= 0 && num <= 100;
        },
        message: "Male percentage must be between 0 and 100",
      },
    },
    femalePercentage: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          const num = parseFloat(v);
          return !isNaN(num) && num >= 0 && num <= 100;
        },
        message: "Female percentage must be between 0 and 100",
      },
    },
    audienceProofUrl: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return v.match(/^https?:\/\/.+/);
        },
        message: "Invalid URL format for audience proof",
      },
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ["bank", "crypto"],
        message: "Payment method must be either 'bank' or 'crypto'",
      },
    },

    // Bank account details
    bankDetails: {
      bankName: {
        type: String,
        trim: true,
        minlength: [2, "Bank name must be at least 2 characters"],
        maxlength: [100, "Bank name must not exceed 100 characters"],
      },
      accountNumber: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return /^\d{10}$/.test(v);
          },
          message: "Account number must be exactly 10 digits",
        },
      },
      accountName: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    hasBankDetails: {
      type: Boolean,
      default: false,
    },
    cryptoDetails: {
      walletAddress: {
        type: String,
        trim: true,
        minlength: [26, "Wallet address must be at least 26 characters"],
        maxlength: [200, "Wallet address must not exceed 200 characters"],
      },
      network: {
        type: String,
        enum: {
          values: validCryptoNetworks,
          message: "Please select a valid cryptocurrency network",
        },
      },
      walletType: {
        type: String,
        trim: true,
        maxlength: [50, "Wallet type must not exceed 50 characters"],
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    hasCryptoDetails: {
      type: Boolean,
      default: false,
    },
    instagram: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for Instagram",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid Instagram URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for Instagram",
        },
      },
      proofUrl: String,
    },
    twitter: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for Twitter",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid Twitter URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for Twitter",
        },
      },
      proofUrl: String,
    },
    tiktok: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for TikTok",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid TikTok URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for TikTok",
        },
      },
      proofUrl: String,
    },
    youtube: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for YouTube",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid YouTube URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for YouTube",
        },
      },
      proofUrl: String,
    },
    facebook: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for Facebook",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid Facebook URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for Facebook",
        },
      },
      proofUrl: String,
    },
    linkedin: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for LinkedIn",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid LinkedIn URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for LinkedIn",
        },
      },
      proofUrl: String,
    },
    discord: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for Discord",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid Discord URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for Discord",
        },
      },
      proofUrl: String,
    },
    threads: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for Threads",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid Threads URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for Threads",
        },
      },
      proofUrl: String,
    },
    snapchat: {
      followers: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid followers count for Snapchat",
        },
      },
      url: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return v.match(/^https?:\/\/.+/);
          },
          message: "Invalid Snapchat URL format",
        },
      },
      impressions: {
        type: String,
        validate: {
          validator: function (v: string) {
            if (!v) return true;
            return !isNaN(Number(v)) && Number(v) >= 0;
          },
          message: "Invalid impressions count for Snapchat",
        },
      },
      proofUrl: String,
    },
    followerFee: {
      type: Number,
      min: 0,
    },
    impressionFee: {
      type: Number,
      min: 0,
    },
    locationFee: {
      type: Number,
      min: 0,
    },
    nicheFee: {
      type: Number,
      min: 0,
    },
    earningsPerPost: {
      type: Number,
      min: 0,
    },
    earningsPerPostNaira: {
      type: Number,
      min: 0,
    },
    maxMonthlyEarnings: {
      type: Number,
      min: 0,
    },
    maxMonthlyEarningsNaira: {
      type: Number,
      min: 0,
    },
    followersCount: {
      type: Number,
      min: 0,
    },
    amountPerPost: {
      type: String,
    },
    amountPerMonth: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: String,
    },
    isValidated: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInfluencer>("Influencer", InfluencerSchema);
