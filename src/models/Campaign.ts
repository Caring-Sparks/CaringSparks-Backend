// Fixed Campaign Model
import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  // User reference
  userId: mongoose.Types.ObjectId;

  // Basic brand information
  role: string;
  platforms: string[];
  brandName: string;
  email: string; // This will come from authenticated user
  brandPhone: string;

  // Campaign requirements
  influencersMin: number;
  influencersMax: number;
  followersRange?: string;
  location: string;
  additionalLocations?: string[];
  postFrequency?: string;
  postDuration?: string;

  // Calculated pricing fields (from frontend calculations)
  avgInfluencers?: number;
  postCount?: number;
  costPerInfluencerPerPost?: number;
  totalBaseCost?: number;
  platformFee?: number;
  totalCost?: number;

  // System fields
  hasPaid: boolean;
  isValidated: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema(
  {
    // User reference - link campaign to user who created it
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Adjust this to match your User model name
      required: [true, "User ID is required"],
    },

    // Basic brand information
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: ["Brand", "Business", "Person", "Movie", "Music", "Other"],
    },
    platforms: {
      type: [String],
      required: [true, "At least one platform is required"],
      enum: [
        "Instagram",
        "X",
        "TikTok",
        "Youtube",
        "Facebook",
        "Linkedin",
        "Threads",
        "Discord",
        "Snapchat",
      ],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one platform must be selected",
      },
    },
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      maxlength: [100, "Brand name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format"],
    },
    brandPhone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    // Campaign requirements
    influencersMin: {
      type: Number,
      required: [true, "Minimum influencers is required"],
      min: [1, "Minimum influencers must be at least 1"],
    },
    influencersMax: {
      type: Number,
      required: [true, "Maximum influencers is required"],
      min: [1, "Maximum influencers must be at least 1"],
    },
    followersRange: {
      type: String,
      enum: ["", "1k-3k", "3k-10k", "10k-20k", "20k-50k", "50k & above"],
      default: "",
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    additionalLocations: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.every((loc) => loc.trim().length > 0);
        },
        message: "Additional locations cannot be empty strings",
      },
    },
    postFrequency: {
      type: String,
      enum: [
        "",
        "5 times per week for 3 weeks = 15 posts in total",
        "3 times per week for 4 weeks = 12 posts in total",
        "2 times per week for 6 weeks = 12 posts in total",
      ],
      default: "",
    },
    postDuration: {
      type: String,
      enum: ["", "1 day", "1 week", "2 weeks", "1 month"],
      default: "",
    },

    // Calculated pricing fields (from frontend)
    avgInfluencers: {
      type: Number,
      min: [0, "Average influencers cannot be negative"],
      default: 0,
    },
    postCount: {
      type: Number,
      min: [0, "Post count cannot be negative"],
      default: 0,
    },
    costPerInfluencerPerPost: {
      type: Number,
      min: [0, "Cost cannot be negative"],
      default: 0,
    },
    totalBaseCost: {
      type: Number,
      min: [0, "Total base cost cannot be negative"],
      default: 0,
    },
    platformFee: {
      type: Number,
      min: [0, "Platform fee cannot be negative"],
      default: 0,
    },
    totalCost: {
      type: Number,
      min: [0, "Total cost cannot be negative"],
      default: 0,
    },

    // System fields
    hasPaid: {
      type: Boolean,
      default: false,
    },
    isValidated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
CampaignSchema.index({ userId: 1 });
CampaignSchema.index({ email: 1 });
CampaignSchema.index({ createdAt: -1 });

// Optional: Prevent duplicate campaign names per user
// CampaignSchema.index({ userId: 1, brandName: 1 }, { unique: true });

export default mongoose.model<ICampaign>("Campaign", CampaignSchema);
