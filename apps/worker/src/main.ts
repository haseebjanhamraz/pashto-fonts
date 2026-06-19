import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import path from "path";

// Load workspace environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log(`[Worker] Connecting to Redis at ${REDIS_URL}`);

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  console.log("[Worker] Redis connection established successfully.");
});

connection.on("error", (err) => {
  console.error("[Worker] Redis connection error:", err);
});

// Setup mock worker for font processing
const worker = new Worker(
  "font-processing",
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} - data:`, job.data);
    // Processing logic goes here in Phase 6
    return { success: true };
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

console.log("[Worker] BullMQ Worker started listening on 'font-processing' queue.");
