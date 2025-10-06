import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string, {
      dbName: process.env.DB_NAME,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("Could not connect to MongoDB:", err);
    process.exit(1);
  }
};

export default connectDB;
