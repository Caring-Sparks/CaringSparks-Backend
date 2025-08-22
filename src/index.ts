import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import brandRoutes from "./routes/brandRoutes";
import influencerRoutes from "./routes/influencerRoutes";
//ENV config
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/influencers", influencerRoutes);
app.get("/", (_, res) => res.send("API is running 🚀"));

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
