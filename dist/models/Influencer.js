"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// models/Influencer.ts
const mongoose_1 = __importStar(require("mongoose"));
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
// Mongoose schema
const InfluencerSchema = new mongoose_1.Schema({
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
            validator: function (v) {
                if (!v)
                    return true; // Optional field
                const num = parseFloat(v);
                return !isNaN(num) && num >= 0 && num <= 100;
            },
            message: "Male percentage must be between 0 and 100",
        },
    },
    femalePercentage: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v)
                    return true; // Optional field
                const num = parseFloat(v);
                return !isNaN(num) && num >= 0 && num <= 100;
            },
            message: "Female percentage must be between 0 and 100",
        },
    },
    audienceProofUrl: {
        type: String,
        validate: {
            validator: function (v) {
                if (!v)
                    return true; // Optional field
                return v.match(/^https?:\/\/.+/);
            },
            message: "Invalid URL format for audience proof",
        },
    },
    // Dynamic platform data
    instagram: {
        followers: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
                    return !isNaN(Number(v)) && Number(v) >= 0;
                },
                message: "Invalid followers count for Instagram",
            },
        },
        url: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
                    return v.match(/^https?:\/\/.+/);
                },
                message: "Invalid Instagram URL format",
            },
        },
        impressions: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
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
                validator: function (v) {
                    if (!v)
                        return true;
                    return !isNaN(Number(v)) && Number(v) >= 0;
                },
                message: "Invalid followers count for Twitter",
            },
        },
        url: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
                    return v.match(/^https?:\/\/.+/);
                },
                message: "Invalid Twitter URL format",
            },
        },
        impressions: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
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
                validator: function (v) {
                    if (!v)
                        return true;
                    return !isNaN(Number(v)) && Number(v) >= 0;
                },
                message: "Invalid followers count for TikTok",
            },
        },
        url: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
                    return v.match(/^https?:\/\/.+/);
                },
                message: "Invalid TikTok URL format",
            },
        },
        impressions: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
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
                validator: function (v) {
                    if (!v)
                        return true;
                    return !isNaN(Number(v)) && Number(v) >= 0;
                },
                message: "Invalid followers count for YouTube",
            },
        },
        url: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
                    return v.match(/^https?:\/\/.+/);
                },
                message: "Invalid YouTube URL format",
            },
        },
        impressions: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
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
                validator: function (v) {
                    if (!v)
                        return true;
                    return !isNaN(Number(v)) && Number(v) >= 0;
                },
                message: "Invalid followers count for Facebook",
            },
        },
        url: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
                    return v.match(/^https?:\/\/.+/);
                },
                message: "Invalid Facebook URL format",
            },
        },
        impressions: {
            type: String,
            validate: {
                validator: function (v) {
                    if (!v)
                        return true;
                    return !isNaN(Number(v)) && Number(v) >= 0;
                },
                message: "Invalid impressions count for Facebook",
            },
        },
        proofUrl: String,
    },
    // Calculated earnings fields (from frontend)
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
    // Legacy fields (keeping for backward compatibility)
    amountPerPost: {
        type: String,
    },
    amountPerMonth: {
        type: String,
    },
    // Metadata
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    emailSent: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
});
exports.default = mongoose_1.default.model("Influencer", InfluencerSchema);
