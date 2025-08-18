import mongoose, { Schema, Document } from "mongoose";

export interface IBrand extends Document {
  role: string;
  platforms: string[];
  brandName: string;
  brandEmail: string;
  brandPhone: string;
  influencersMin: number;
  influencersMax: number;
  followersRange: string;
  location: string;
  additionalLocations: string[];
  postFrequency: string;
  postDuration: string;
  password: string;
  hasPaid: boolean;
  isValidated: boolean;
}

const brandSchema: Schema = new Schema(
  {
    role: { type: String, required: true },
    platforms: { type: [String], required: true },
    brandName: { type: String, required: true },
    brandEmail: { type: String, required: true },
    brandPhone: { type: String, required: true },
    influencersMin: { type: Number, required: true },
    influencersMax: { type: Number, required: true },
    followersRange: { type: String },
    location: { type: String, required: true },
    additionalLocations: { type: [String], default: [] },
    postFrequency: { type: String },
    postDuration: { type: String },
    password: { type: String },
    hasPaid: { type: Boolean },
    isValidated: { type: Boolean },
  },
  { timestamps: true }
);

export default mongoose.model<IBrand>("Brand", brandSchema);
