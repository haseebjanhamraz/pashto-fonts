import { prisma } from "../../utils/db";
import { GetFontsQuery } from "./fonts.schema";
import { FontStatus, Prisma } from "@prisma/client";

export class FontsService {
  static async getFonts(query: GetFontsQuery) {
    const { page, limit, search, category, language, sort } = query;
    const skip = (page - 1) * limit;

    // Build Prisma query condition
    const where: Prisma.FontWhereInput = {
      status: FontStatus.PUBLISHED,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { designer: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (language) {
      if (language === "pashto") where.supportsPashto = true;
      if (language === "urdu") where.supportsUrdu = true;
      if (language === "arabic") where.supportsArabic = true;
      if (language === "persian") where.supportsPersian = true;
    }

    // Build sorting condition
    let orderBy: Prisma.FontOrderByWithRelationInput = {};
    if (sort === "latest") {
      orderBy = { createdAt: "desc" };
    } else if (sort === "popular") {
      orderBy = { viewCount: "desc" };
    } else if (sort === "downloads") {
      orderBy = { downloadCount: "desc" };
    } else if (sort === "name") {
      orderBy = { name: "asc" };
    }

    // Execute queries in parallel
    const [total, fonts] = await Promise.all([
      prisma.font.count({ where }),
      prisma.font.findMany({
        where,
        include: {
          category: true,
          files: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return {
      fonts,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    };
  }

  static async getFontBySlug(slug: string) {
    return prisma.font.findUnique({
      where: { slug },
      include: {
        category: true,
        files: true,
      },
    });
  }

  static async incrementViews(slug: string) {
    try {
      await prisma.font.update({
        where: { slug },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error(`[FontsService] Failed to increment views for ${slug}:`, error);
    }
  }
}
