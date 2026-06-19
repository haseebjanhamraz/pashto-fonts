import { AdminRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      admin?: {
        adminId: string;
        email: string;
        role: AdminRole;
      };
    }
  }
}
