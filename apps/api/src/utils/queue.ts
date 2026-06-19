import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on("error", (err) => {
  console.error("[Queue] Redis connection error:", err);
});

// Initialize the queue for font processing
export const fontProcessingQueue = new Queue("font-processing", {
  connection: connection as any,
});

console.log("[Queue] BullMQ 'font-processing' queue initialized successfully.");
