import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../utils/db";

const JWT_SECRET = process.env.JWT_SECRET || "super_secure_jwt_secret_please_change_in_production";
const JWT_EXPIRES_IN = "24h";

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(adminId: string, email: string, role: string): string {
    return jwt.sign({ adminId, email, role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static async findAdminByEmail(email: string) {
    return prisma.admin.findUnique({
      where: { email },
    });
  }
}
