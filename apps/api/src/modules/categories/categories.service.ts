import { prisma } from "../../utils/db";

export class CategoriesService {
  static async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async getCategoryBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
    });
  }
}
