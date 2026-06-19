import { Router, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { z } from "zod";
import { requireAdmin, AuthenticatedRequest } from "../auth/auth.middleware";
import { prisma } from "../../utils/db";
import { fontProcessingQueue } from "../../utils/queue";
import { FontStatus } from "@prisma/client";
import { rateLimiter } from "../../middlewares/rate-limit.middleware";
import { redis } from "../../utils/redis";

const router = Router();

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File validation filter
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedExtensions = [".ttf", ".otf", ".woff", ".woff2"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Only TTF, OTF, WOFF, and WOFF2 files are allowed."));
  }
};

const limitMb = parseInt(process.env.MAX_FONT_UPLOAD_MB || "20", 10);

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: limitMb * 1024 * 1024, // conversion to bytes
  },
}).single("fontFile");

// Helper to generate a basic slug
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

// POST /api/admin/fonts/upload
router.post("/upload", requireAdmin, rateLimiter(10, 60), (req: AuthenticatedRequest, res: Response) => {
  upload(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: {
          code: "UPLOAD_TOO_LARGE",
          message: `File size exceeds the limit of ${limitMb}MB.`,
        },
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: "UPLOAD_INVALID_TYPE",
          message: err.message,
        },
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "UPLOAD_NO_FILE",
          message: "No file was uploaded.",
        },
      });
    }

    try {
      const originalName = req.file.originalname;
      const baseName = path.parse(originalName).name;
      
      // Clean name for placeholder (e.g. "bahij-titr-bold" -> "Bahij Titr Bold")
      const fontName = baseName
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const uniqueSuffix = Date.now().toString().slice(-4);
      const slug = `${slugify(baseName)}-${uniqueSuffix}`;

      // Create PROCESSING font record
      const font = await prisma.font.create({
        data: {
          name: fontName,
          slug,
          status: FontStatus.PROCESSING,
          license: "Open Source",
        },
      });

      // Dispatch processing job to BullMQ
      const job = await fontProcessingQueue.add("process-font", {
        fontId: font.id,
        filePath: req.file.path,
        originalFilename: req.file.filename,
      });

      console.log(`[Upload] Font record ${font.id} created, job ${job.id} dispatched.`);

      return res.status(201).json({
        success: true,
        data: {
          id: font.id,
          name: font.name,
          slug: font.slug,
          status: font.status,
          jobId: job.id,
        },
      });
    } catch (error) {
      console.error("[Upload] Error saving font record:", error);
      // Clean up uploaded file in case of DB failure
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An internal server error occurred while registering the uploaded font.",
        },
      });
    }
  });
});

// Zod schema for updating font metadata
const updateFontSchema = z.object({
  name: z.string().min(1, "Name is required."),
  slug: z.string().min(1, "Slug is required."),
  designer: z.string().optional().nullable(),
  publisher: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PROCESSING", "PUBLISHED", "PRIVATE", "ARCHIVED", "ERROR"]),
  isFeatured: z.boolean().default(false),
  supportsPashto: z.boolean().default(false),
  supportsUrdu: z.boolean().default(false),
  supportsArabic: z.boolean().default(false),
  supportsPersian: z.boolean().default(false),
});

// GET /api/admin/fonts — List all fonts for admin tables
router.get("/", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || "1", 10);
    const limit = parseInt(req.query.limit as string || "20", 10);
    const search = req.query.search as string || "";
    const status = req.query.status as string || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { designer: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [total, fonts] = await Promise.all([
      prisma.font.count({ where }),
      prisma.font.findMany({
        where,
        include: {
          category: true,
          files: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: fonts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[AdminFonts] Error listing fonts:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to load fonts list.",
      },
    });
  }
});

// GET /api/admin/fonts/:id — Get details of a single font (including drafts) for editing
router.get("/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const font = await prisma.font.findUnique({
      where: { id },
      include: {
        category: true,
        files: true,
      },
    });

    if (!font) {
      return res.status(404).json({
        success: false,
        error: {
          code: "FONT_NOT_FOUND",
          message: "Font not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: font,
    });
  } catch (error) {
    console.error("[AdminFonts] Error fetching font:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch font details.",
      },
    });
  }
});

// PUT /api/admin/fonts/:id — Update font metadata
router.put("/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parsedBody = updateFontSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid font update payload.",
          details: parsedBody.error.format(),
        },
      });
    }

    // Verify font exists
    const fontExists = await prisma.font.findUnique({ where: { id } });
    if (!fontExists) {
      return res.status(404).json({
        success: false,
        error: {
          code: "FONT_NOT_FOUND",
          message: "Font not found.",
        },
      });
    }

    const updatedFont = await prisma.font.update({
      where: { id },
      data: parsedBody.data,
      include: {
        category: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: updatedFont,
    });
  } catch (error) {
    console.error("[AdminFonts] Error updating font:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update font metadata.",
      },
    });
  }
});

// DELETE /api/admin/fonts/:id — Delete font and cascade delete files
router.delete("/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verify font exists
    const font = await prisma.font.findUnique({ where: { id } });
    if (!font) {
      return res.status(404).json({
        success: false,
        error: {
          code: "FONT_NOT_FOUND",
          message: "Font not found.",
        },
      });
    }

    // Cascades delete files in database
    await prisma.font.delete({
      where: { id },
    });

    // Note: S3 file unlinking can be done asynchronously in background if desired

    return res.status(200).json({
      success: true,
      data: { message: "Font deleted successfully." },
    });
  } catch (error) {
    console.error("[AdminFonts] Error deleting font:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to delete font.",
      },
    });
  }
});

// GET /api/admin/fonts/:id/progress — Get realtime font processing status & progress from Redis
router.get("/:id/progress", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify font exists in DB
    const font = await prisma.font.findUnique({ where: { id } });
    if (!font) {
      return res.status(404).json({
        success: false,
        error: {
          code: "FONT_NOT_FOUND",
          message: "Font not found.",
        },
      });
    }

    const redisKey = `font:progress:${id}`;
    const rawProgress = await redis.get(redisKey);

    let progressData = {
      progress: 0,
      estimatedRemainingSeconds: 0,
      step: "سیسټم په انتظار کې دی (System pending)",
      status: font.status,
    };

    if (rawProgress) {
      const parsed = JSON.parse(rawProgress);
      progressData = {
        ...parsed,
        status: font.status,
      };
    } else {
      // Fallback based on database status
      if (font.status === FontStatus.DRAFT || font.status === FontStatus.PUBLISHED) {
        progressData = {
          progress: 100,
          estimatedRemainingSeconds: 0,
          step: "پروسس په بریالیتوب سره بشپړ شو (Processing completed)",
          status: font.status,
        };
      } else if (font.status === FontStatus.ERROR) {
        progressData = {
          progress: 0,
          estimatedRemainingSeconds: 0,
          step: "تېروتنه رامنځته شوه (Error occurred during processing)",
          status: font.status,
        };
      } else if (font.status === FontStatus.PROCESSING) {
        progressData = {
          progress: 5,
          estimatedRemainingSeconds: 10,
          step: "پروسس پیل شو (Processing initiated)",
          status: font.status,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: progressData,
    });
  } catch (error) {
    console.error("[AdminFonts] Error fetching progress:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch progress details.",
      },
    });
  }
});

export const uploadsRouter = router;
