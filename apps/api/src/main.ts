import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import { fontsRouter } from "./modules/fonts/fonts.router";
import { categoriesRouter } from "./modules/categories/categories.router";
import { authRouter } from "./modules/auth/auth.router";
import { uploadsRouter } from "./modules/uploads/uploads.router";

import { cssRouter } from "./modules/css/css.router";

// Load workspace environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  next();
});

// Mount routers
app.use("/css2", cssRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin/fonts", uploadsRouter);
app.use("/api/fonts", fontsRouter);
app.use("/api/categories", categoriesRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "development",
  });
});

app.listen(PORT, () => {
  console.log(`[API] Server is running on http://localhost:${PORT}`);
});
