import { Worker } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import path from "path";

import { FontProcessor } from "./processors/font-processor";

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

// Setup worker for font processing
const worker = new Worker(
  "font-processing",
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} - data:`, job.data);
    const { fontId, filePath, originalFilename } = job.data;
    await FontProcessor.processFont(fontId, filePath, originalFilename);
    return { success: true };
  },
  { connection: connection as any }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

console.log("[Worker] BullMQ Worker started listening on 'font-processing' queue.");
