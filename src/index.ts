import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
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
const allowedOrigins = [process.env.ALLOWED_ORIGIN];

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

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many authentication attempts, please try again later.",
    retryAfter: "15 minutes"
  },
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});

// limiter for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many payment requests, please try again later.",
    retryAfter: "1 hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// limiter for write operations (POST, PUT, DELETE, PATCH)
const writeOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: "Too many write operations, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// limiter for read operations (GET)
const readOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: "Too many read requests, please try again later.",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// DB Connection
connectDB();

// Routes with specific rate limiters
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admins", writeOperationLimiter, adminRoutes);
app.use("/api/brands", writeOperationLimiter, brandRoutes);
app.use("/api/influencers", writeOperationLimiter, influencerRoutes);
app.use("/api/campaigns", writeOperationLimiter, campaignRoutes);
app.use("/api/payment", paymentLimiter, paymentRoutes);
app.use("/api/deliverables", writeOperationLimiter, deliverablesRoutes);
app.use("/api/reviews", writeOperationLimiter, reviewRoutes);

app.get("/", readOperationLimiter, (_, res) => res.send("API is running"));

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
