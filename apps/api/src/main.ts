import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fontsRouter } from "./modules/fonts/fonts.router";
import { categoriesRouter } from "./modules/categories/categories.router";

// Load workspace environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Mount routers
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
