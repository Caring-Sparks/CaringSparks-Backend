import mongoose, { Schema, Document } from "mongoose";

export interface IBrand extends Document {
  // Basic brand information
  role: string;
  platforms: string[];
  brandName: string;
  email: string;
  brandPhone: string;

  // Campaign requirements
  influencersMin: number;
  influencersMax: number;
  followersRange: string;
  location: string;
  additionalLocations: string[];
  postFrequency: string;
  postDuration: string;

  // Calculated pricing fields (from frontend calculations)
  avgInfluencers?: number;
  postCount?: number;
  costPerInfluencerPerPost?: number;
  totalBaseCost?: number;
  platformFee?: number;
  totalCost?: number;

  // System fields
  password: string;
  hasPaid: boolean;
  isValidated: boolean;
  passwordResetToken: string;
  passwordResetExpires: string;
}

const brandSchema: Schema = new Schema(
  {
    // Basic brand information
    role: {
      type: String,
      required: true,
      enum: ["Brand", "Business", "Person", "Movie", "Music", "Other"],
    },
    platforms: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one platform must be selected",
      },
    },
    brandName: {
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
    brandPhone: {
      type: String,
      required: true,
      trim: true,
    },

    // Campaign requirements
    influencersMin: {
      type: Number,
      required: true,
      min: [1, "Minimum influencers must be at least 1"],
    },
    influencersMax: {
      type: Number,
      required: true,
      min: [1, "Maximum influencers must be at least 1"],
      validate: {
        validator: function (this: IBrand, v: number) {
          return v >= this.influencersMin;
        },
        message: "Maximum must be greater than or equal to minimum",
      },
    },
    followersRange: {
      type: String,
      enum: ["", "1k-3k", "3k-10k", "10k-20k", "20k-50k", "50k & above"],
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    additionalLocations: {
      type: [String],
      default: [],
    },
    postFrequency: {
      type: String,
      enum: [
        "",
        "5 times per week for 3 weeks = 15 posts in total",
        "3 times per week for 4 weeks = 12 posts in total",
        "2 times per week for 6 weeks = 12 posts in total",
      ],
    },
    postDuration: {
      type: String,
      enum: ["", "1 day", "1 week", "2 weeks", "1 month"],
    },

    // Calculated pricing fields (from frontend)
    avgInfluencers: {
      type: Number,
      min: 0,
    },
    postCount: {
      type: Number,
      min: 0,
    },
    costPerInfluencerPerPost: {
      type: Number,
      min: 0,
    },
    totalBaseCost: {
      type: Number,
      min: 0,
    },
    platformFee: {
      type: Number,
      min: 0,
    },
    totalCost: {
      type: Number,
      min: 0,
    },

    // System fields
    password: {
      type: String,
      required: true,
    },
    hasPaid: {
      type: Boolean,
      default: false,
    },
    isValidated: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBrand>("Brand", brandSchema);
