import { PrismaClient, FontStatus, FontStyle, FontFormat } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Seeding Bahij Titr font...");

  // Find the 'display' category
  const displayCategory = await prisma.category.findUnique({
    where: { slug: "display" },
  });

  if (!displayCategory) {
    console.error("[Seed] 'Display' category not found. Please seed categories first.");
    return;
  }

  // Create the Bahij Titr Font record
  const font = await prisma.font.upsert({
    where: { slug: "bahij-titr" },
    update: {
      status: FontStatus.PUBLISHED,
      isFeatured: true,
      supportsPashto: true,
      supportsUrdu: true,
      supportsArabic: true,
      supportsPersian: true,
      categoryId: displayCategory.id,
    },
    create: {
      name: "Bahij Titr",
      slug: "bahij-titr",
      description: "A beautiful bold display Pashto font ideal for headings and banners.",
      designer: "Bahij",
      publisher: "Bahij Fonts",
      sourceUrl: "https://github.com/kpcybers",
      license: "Open Source",
      status: FontStatus.PUBLISHED,
      isFeatured: true,
      supportsPashto: true,
      supportsUrdu: true,
      supportsArabic: true,
      supportsPersian: true,
      categoryId: displayCategory.id,
    },
  });

  console.log(`[Seed] Seeded Font: ${font.name}`);

  // Create corresponding FontFile record
  const fontFile = await prisma.fontFile.upsert({
    where: { id: "bahij-titr-file-bold" },
    update: {
      fileUrl: "http://localhost:3000/fonts/bahij-titr-bold.ttf",
    },
    create: {
      id: "bahij-titr-file-bold",
      fontId: font.id,
      weight: 700,
      style: FontStyle.NORMAL,
      format: FontFormat.TTF,
      fileUrl: "http://localhost:3000/fonts/bahij-titr-bold.ttf",
      storageKey: "fonts/bahij-titr-bold.ttf",
      isWebFont: true,
      fileSize: 362372,
      originalFilename: "bahij-titr-bold.ttf",
    },
  });

  console.log(`[Seed] Seeded FontFile: ${fontFile.originalFilename} with URL: ${fontFile.fileUrl}`);
  console.log("[Seed] Bahij Titr seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("[Seed] Error during Bahij Titr seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
