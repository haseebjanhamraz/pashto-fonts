import { Router, Request, Response } from "express";
import { CategoriesService } from "./categories.service";

const router = Router();

// GET /api/categories
router.get("/", async (req: Request, res: Response) => {
  try {
    const categories = await CategoriesService.getCategories();
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error("[CategoriesRouter] Error fetching categories:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

// GET /api/categories/:slug
router.get("/:slug", async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const category = await CategoriesService.getCategoryBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CATEGORY_NOT_FOUND",
          message: "Category not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error(`[CategoriesRouter] Error fetching category by slug ${req.params.slug}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

export const categoriesRouter = router;
