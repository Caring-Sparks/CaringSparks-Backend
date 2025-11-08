import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import brandRoutes from "./routes/brandRoutes";
import influencerRoutes from "./routes/influencerRoutes";
import adminRoutes from "./routes/adminRoutes";
import campaignRoutes from "./routes/campaignRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import deliverablesRoutes from "./routes/deliverablesRoutes";
import reviewRoutes from "./routes/reviewRoutes";
//ENV config
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middlewares

//CORS
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(express.json());

// DB Connection
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/influencers", influencerRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/deliverables", deliverablesRoutes);
app.use("/api/reviews", reviewRoutes);
app.get("/", (_, res) => res.send("API is running"));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
