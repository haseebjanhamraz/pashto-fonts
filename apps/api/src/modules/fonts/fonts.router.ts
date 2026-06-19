import { Router, Request, Response } from "express";
import { getFontsQuerySchema } from "./fonts.schema";
import { FontsService } from "./fonts.service";
import { FontStatus } from "@prisma/client";

const router = Router();

// GET /api/fonts
router.get("/", async (req: Request, res: Response) => {
  try {
    const parsedQuery = getFontsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters.",
          details: parsedQuery.error.format(),
        },
      });
    }

    const result = await FontsService.getFonts(parsedQuery.data);

    return res.status(200).json({
      success: true,
      data: result.fonts,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    console.error("[FontsRouter] Error fetching fonts:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

// GET /api/fonts/:slug
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const font = await FontsService.getFontBySlug(slug);

    if (!font || font.status !== FontStatus.PUBLISHED) {
      return res.status(404).json({
        success: false,
        error: {
          code: "FONT_NOT_FOUND",
          message: "Font not found or not published.",
        },
      });
    }

    // Increment view count asynchronously in the background
    FontsService.incrementViews(slug);

    return res.status(200).json({
      success: true,
      data: font,
    });
  } catch (error: any) {
    console.error(`[FontsRouter] Error fetching font by slug ${req.params.slug}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

export const fontsRouter = router;
