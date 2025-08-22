"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./config/db"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const brandRoutes_1 = __importDefault(require("./routes/brandRoutes"));
const influencerRoutes_1 = __importDefault(require("./routes/influencerRoutes"));
//ENV config
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// DB Connection
(0, db_1.default)();
// Routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/brands", brandRoutes_1.default);
app.use("/api/influencers", influencerRoutes_1.default);
app.get("/", (_, res) => res.send("API is running 🚀"));
// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
