import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new IORedis(REDIS_URL);

redis.on("connect", () => {
  console.log("[Redis Worker] Connected successfully.");
});

redis.on("error", (err) => {
  console.error("[Redis Worker] Connection error:", err);
});
