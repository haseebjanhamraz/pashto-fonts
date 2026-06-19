import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Naskh", slug: "naskh", description: "Standard clear cursive style used for general body text and publications." },
  { name: "Nastaliq", slug: "nastaliq", description: "Elegant, sloped calligraphic style primarily used for poetry and artistic headings." },
  { name: "Kufi", slug: "kufi", description: "Geometric, blocky style commonly used in titles, logos, and architectural lettering." },
  { name: "Modern", slug: "modern", description: "Clean contemporary styles suited for modern branding and websites." },
  { name: "Sans", slug: "sans", description: "Sans-serif styles with minimal decorative extensions." },
  { name: "Serif", slug: "serif", description: "Serif styles featuring traditional details." },
  { name: "Calligraphy", slug: "calligraphy", description: "Freehand artistic scripting designs." },
  { name: "Display", slug: "display", description: "Bold, unique fonts meant for large sizes and banners." },
  { name: "News", slug: "news", description: "High-readability newspaper and editorial body text styles." },
  { name: "UI", slug: "ui", description: "Optimized designs for user interfaces, buttons, and app screens." },
];

async function main() {
  console.log("[Seed] Seeding default categories...");
  for (const category of defaultCategories) {
    const upserted = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
    });
    console.log(`[Seed] Seeded category: ${upserted.name} (${upserted.slug})`);
  }
  console.log("[Seed] Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error("[Seed] Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
