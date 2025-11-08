import mongoose, { Schema, type Document } from "mongoose";

export interface IAssignedInfluencer {
  influencerId: mongoose.Types.ObjectId;
  acceptanceStatus: "pending" | "accepted" | "declined";
  assignedAt: Date;
  respondedAt?: Date;
  isCompleted: string;
  completedAt?: Date;
  submittedJobs: ISubmittedJob[];
  stashedDeliverables?: Array<{
    stashId: string;
    stashName?: string;
    deliverables: Array<{
      platform: string;
      url: string;
      description: string;
      metrics?: {
        views?: number;
        likes?: number;
        comments?: number;
        shares?: number;
      };
    }>;
    stashedAt: Date;
  }>;
}

// Interface for review comments
export interface IReviewComment {
  _id?: mongoose.Types.ObjectId;
  authorType: "brand" | "influencer";
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  comment: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Interface for submitted job
export interface ISubmittedJob {
  description: string;
  postUrl: string;
  submittedAt: Date;
  isApproved?: boolean;
  approvedAt?: Date;
  rejectionReason?: string;
  reviews: IReviewComment[];
}

// Interface for campaign materials
export interface ICampaignMaterial {
  _id?: mongoose.Types.ObjectId;
  imageUrl: string;
  contentType: string;
  postDescription: string;
  fileType?: "image" | "video";
  mediaType?: "image" | "video";
  duration?: number;
  format?: string;
  width?: number;
  height?: number;
  uploadedAt?: Date;
}

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;

  // Basic brand information
  role: string;
  platforms: string[];
  brandName: string;
  email: string;
  brandPhone: string;

  // Campaign requirements
  influencersMin: number;
  influencersMax: number;
  followersRange?: string;
  location: string;
  additionalLocations?: string[];
  postFrequency?: string;
  postDuration?: string;
  campaignMaterials: ICampaignMaterial[];
  assignedInfluencers: IAssignedInfluencer[];

  // Calculated pricing fields
  avgInfluencers?: number;
  postCount?: number;
  costPerInfluencerPerPost?: number;
  totalBaseCost?: number;
  platformFee?: number;
  totalCost?: number;

  // Payment fields
  hasPaid: boolean;
  paymentReference?: string;
  paymentDate?: string;

  // Detailed payment information
  paymentDetails?: {
    flutterwaveTransactionId?: number;
    amount?: number;
    currency?: string;
    customerEmail?: string;
    paymentMethod?: string;
    processorResponse?: string;
    chargedAmount?: number;
    completedAt?: Date;
  };

  // System fields
  isValidated: boolean;
  status: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Schema for review comments
const ReviewCommentSchema: Schema = new Schema(
  {
    authorType: {
      type: String,
      enum: ["brand", "influencer"],
      required: [true, "Author type is required"],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Author ID is required"],
      refPath: "authorType",
    },
    authorName: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

// Schema for submitted jobs
const SubmittedJobSchema: Schema = new Schema(
  {
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    postUrl: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    isApproved: {
      type: Boolean,
      default: undefined,
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [200, "Rejection reason cannot exceed 200 characters"],
    },
    reviews: {
      type: [ReviewCommentSchema],
      default: [],
    },
  },
  { _id: true }
);

// Schema for assigned influencers
const AssignedInfluencerSchema: Schema = new Schema(
  {
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Influencer",
      required: [true, "Influencer ID is required"],
    },
    acceptanceStatus: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    isCompleted: {
      type: String,
      default: "pending",
    },
    completedAt: {
      type: Date,
    },
    submittedJobs: {
      type: [SubmittedJobSchema],
      default: [],
    },
    stashedDeliverables: {
      type: [
        {
          stashId: {
            type: String,
            required: true,
            default: () => new mongoose.Types.ObjectId().toString(),
          },
          stashName: { type: String },
          deliverables: [
            {
              platform: { type: String, required: true },
              url: { type: String, required: true },
              description: { type: String, required: true },
              metrics: {
                views: { type: Number, default: 0 },
                likes: { type: Number, default: 0 },
                comments: { type: Number, default: 0 },
                shares: { type: Number, default: 0 },
              },
            },
          ],
          stashedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { _id: true }
);

// Schema for campaign materials
const CampaignMaterialSchema: Schema = new Schema(
  {
    imageUrl: {
      type: String,
      required: [true, "Material URL is required"],
      trim: true,
    },
    postDescription: {
      type: String,
      required: [true, "Post description is required"],
      trim: true,
      maxlength: [1000, "Post description cannot exceed 1000 characters"],
    },
    fileType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },
    contentType: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
    },
    duration: {
      type: Number,
      min: [0, "Duration cannot be negative"],
    },
    format: {
      type: String,
      trim: true,
    },
    width: {
      type: Number,
      min: [0, "Width cannot be negative"],
    },
    height: {
      type: Number,
      min: [0, "Height cannot be negative"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const CampaignSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "User ID is required"],
    },
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
        validator: (v: string[]) => v && v.length > 0,
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
        validator: (v: string[]) => v.every((loc) => loc.trim().length > 0),
        message: "Additional locations cannot be empty strings",
      },
    },
    postFrequency: {
      type: String,
      default: "",
    },
    postDuration: {
      type: String,
      enum: ["", "1 day", "1 week", "2 weeks", "1 month"],
      default: "",
    },
    campaignMaterials: {
      type: [CampaignMaterialSchema],
      default: [],
    },
    assignedInfluencers: {
      type: [AssignedInfluencerSchema],
      default: [],
    },
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
    hasPaid: {
      type: Boolean,
      default: false,
    },
    paymentReference: {
      type: String,
    },
    paymentDate: {
      type: String,
    },
    paymentDetails: {
      flutterwaveTransactionId: {
        type: Number,
      },
      amount: {
        type: Number,
        min: [0, "Amount cannot be negative"],
      },
      currency: {
        type: String,
        uppercase: true,
      },
      customerEmail: {
        type: String,
        lowercase: true,
      },
      paymentMethod: {
        type: String,
      },
      processorResponse: {
        type: String,
      },
      chargedAmount: {
        type: Number,
        min: [0, "Charged amount cannot be negative"],
      },
      completedAt: {
        type: Date,
      },
    },
    isValidated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ userId: 1 });
CampaignSchema.index({ email: 1 });
CampaignSchema.index({ createdAt: -1 });
CampaignSchema.index({ hasPaid: 1 });
CampaignSchema.index({ paymentReference: 1 });
CampaignSchema.index({ "assignedInfluencers.influencerId": 1 });
CampaignSchema.index({ "assignedInfluencers.acceptanceStatus": 1 });
CampaignSchema.index({ "assignedInfluencers.isCompleted": 1 });

// Ensure virtual fields are serialized
CampaignSchema.set("toJSON", { virtuals: true });
CampaignSchema.set("toObject", { virtuals: true });

export default mongoose.model<ICampaign>("Campaign", CampaignSchema);
