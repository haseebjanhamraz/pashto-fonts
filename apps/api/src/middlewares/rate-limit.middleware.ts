import { Request, Response, NextFunction } from "express";
import { redis } from "../utils/redis";

export function rateLimiter(limit: number, windowSecs: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Bypass rate limiting in test environments
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
    const clientIp = Array.isArray(ip) ? ip[0] : (ip as string)?.split(",")[0].trim() || "unknown";
    const key = `ratelimit:${clientIp}:${req.baseUrl || ""}${req.path}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSecs);
      }
      if (current > limit) {
        return res.status(429).json({
          success: false,
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests. Please try again later.",
          },
        });
      }
      next();
    } catch (error) {
      console.error("[RateLimiter] Redis error:", error);
      next(); // Fail-open to avoid service outages if Redis has temporary issues
    }
  };
}
