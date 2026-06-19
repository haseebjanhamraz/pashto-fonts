import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";

export interface AuthenticatedRequest extends Request {
  admin?: {
    adminId: string;
    email: string;
    role: any;
  };
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.token;

    // Fallback to Authorization Header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token is missing.",
        },
      });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired authentication token.",
        },
      });
    }

    // Attach decoded user context to req.admin
    req.admin = {
      adminId: decoded.adminId,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    console.error("[AuthMiddleware] Error verifying admin auth:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred during authentication.",
      },
    });
  }
}
