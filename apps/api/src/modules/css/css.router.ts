import { Router, Request, Response } from "express";
import { CssService } from "./css.service";
import { rateLimiter } from "../../middlewares/rate-limit.middleware";

const router = Router();

// GET /css2?family=Font+Name:wght@400;700&display=swap
router.get("/", rateLimiter(100, 60), async (req: Request, res: Response) => {
  try {
    const { family, display = "swap" } = req.query;

    if (!family) {
      res.setHeader("Content-Type", "text/css; charset=utf-8");
      return res.status(400).send("/* Error: 'family' query parameter is required. Example: /css2?family=BBC+Reith+Qalam */");
    }

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    // Set caching headers
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Type", "text/css; charset=utf-8");

    // Generate stylesheet
    const cssContent = await CssService.generateCss(
      family as string | string[],
      display as string
    );

    return res.status(200).send(cssContent);
  } catch (error: any) {
    console.error("[CssRouter] Error generating embed stylesheet:", error);
    res.setHeader("Content-Type", "text/css; charset=utf-8");
    return res.status(500).send("/* Internal Server Error: Failed to generate stylesheet. */");
  }
});

export const cssRouter = router;
