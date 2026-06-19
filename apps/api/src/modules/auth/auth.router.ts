import { Router, Request, Response } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { requireAdmin, AuthenticatedRequest } from "./auth.middleware";
import { rateLimiter } from "../../middlewares/rate-limit.middleware";

const router = Router();

const loginSchema = z.object({
  email: z.string().email("Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

// POST /api/auth/login
router.post("/login", rateLimiter(5, 60), async (req: Request, res: Response) => {
  try {
    const parsedBody = loginSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid body parameters.",
          details: parsedBody.error.format(),
        },
      });
    }

    const { email, password } = parsedBody.data;
    const admin = await AuthService.findAdminByEmail(email);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    const isValid = await AuthService.comparePasswords(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    const token = AuthService.generateToken(admin.id, admin.email, admin.role);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.status(200).json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token,
      },
    });
  } catch (error) {
    console.error("[AuthRouter] Login error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred.",
      },
    });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token");
  return res.status(200).json({
    success: true,
    data: { message: "Logged out successfully." },
  });
});

// GET /api/auth/me
router.get("/me", requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    success: true,
    data: req.admin,
  });
});

export const authRouter = router;
