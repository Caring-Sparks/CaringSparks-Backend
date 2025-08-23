import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAdmin extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  passwordResetToken: string;
  passwordResetExpires: string;
  isValidated: boolean;
}

const AdminSchema: Schema<IAdmin> = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
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
  { timestamps: true }
);

const Admin = mongoose.model<IAdmin>("Admin", AdminSchema);
export default Admin;
