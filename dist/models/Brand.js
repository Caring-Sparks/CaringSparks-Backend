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
const mongoose_1 = __importStar(require("mongoose"));
const brandSchema = new mongoose_1.Schema({
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
            validator: function (v) {
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
            validator: function (v) {
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
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model("Brand", brandSchema);
