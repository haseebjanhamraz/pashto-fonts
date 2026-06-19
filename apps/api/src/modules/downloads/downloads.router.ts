import { Router, Request, Response } from "express";
import AdmZip from "adm-zip";
import { prisma } from "../../utils/db";
import { FontStatus, FontFormat } from "@prisma/client";
import { rateLimiter } from "../../middlewares/rate-limit.middleware";

const router = Router();

// GET /api/fonts/:slug/download?format=zip|woff2|original
router.get("/:slug/download", rateLimiter(20, 60), async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { format = "zip" } = req.query;

    const font = await prisma.font.findUnique({
      where: { slug },
      include: {
        category: true,
        files: true,
      },
    });

    if (!font || font.status !== FontStatus.PUBLISHED) {
      return res.status(404).json({
        success: false,
        error: {
          code: "FONT_NOT_FOUND",
          message: "Font not found or not published.",
        },
      });
    }

    const files = font.files;
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FILES_AVAILABLE",
          message: "No files are associated with this font.",
        },
      });
    }

    // Increment download count asynchronously
    prisma.font
      .update({
        where: { id: font.id },
        data: { downloadCount: { increment: 1 } },
      })
      .catch((err) => console.error(`[Downloads] Failed to increment count for ${slug}:`, err));

    // Redirect to direct formats if requested
    if (format === "woff2") {
      const woff2File = files.find((f) => f.format === FontFormat.WOFF2);
      if (woff2File) {
        return res.redirect(woff2File.fileUrl);
      }
    } else if (format === "original") {
      const originalFile = files.find((f) => f.format !== FontFormat.WOFF2);
      if (originalFile) {
        return res.redirect(originalFile.fileUrl);
      }
    }

    // Default: Generate ZIP package containing original + webfonts + stylesheets
    console.log(`[Downloads] Packaging ZIP for font: ${font.name}`);
    const zip = new AdmZip();

    // Fetch and append font files into ZIP
    let cssText = "";
    for (const file of files) {
      try {
        const fileRes = await fetch(file.fileUrl);
        if (!fileRes.ok) {
          console.error(`[Downloads] Failed to fetch font file from S3: ${file.fileUrl}`);
          continue;
        }

        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = file.originalFilename || `${font.slug}-${file.weight}.${file.format.toLowerCase()}`;

        // Add file to ZIP
        zip.addFile(fileName, buffer);

        // Generate @font-face rule for stylesheet
        const formatStr = file.format.toLowerCase();
        cssText += `@font-face {\n`;
        cssText += `  font-family: "${font.name}";\n`;
        cssText += `  font-style: ${file.style.toLowerCase()};\n`;
        cssText += `  font-weight: ${file.weight};\n`;
        cssText += `  src: url("./${fileName}") format("${formatStr}");\n`;
        cssText += `}\n\n`;
      } catch (err) {
        console.error(`[Downloads] Error adding file ${file.fileUrl} to ZIP:`, err);
      }
    }

    // Add CSS stylesheet file
    zip.addFile("stylesheet.css", Buffer.from(cssText, "utf-8"));

    // Add Info / README.txt
    let readmeText = `Pashto Fonts catalog - Download details\n`;
    readmeText += `=========================================\n\n`;
    readmeText += `Font Name:   ${font.name}\n`;
    readmeText += `Designer:    ${font.designer || "Unknown Designer"}\n`;
    readmeText += `Publisher:   ${font.publisher || "Unknown Publisher"}\n`;
    readmeText += `License:     ${font.license || "Open Source"}\n`;
    if (font.sourceUrl) {
      readmeText += `Source Link: ${font.sourceUrl}\n`;
    }
    readmeText += `\nThank you for using Pashto Fonts!\n`;

    zip.addFile("info.txt", Buffer.from(readmeText, "utf-8"));

    const zipBuffer = zip.toBuffer();

    // Set response download headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${font.slug}.zip"`);
    res.setHeader("Content-Length", zipBuffer.length);
    
    return res.status(200).send(zipBuffer);
  } catch (error) {
    console.error(`[Downloads] Error downloading font ${req.params.slug}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An internal server error occurred during packaging.",
      },
    });
  }
});

export const downloadsRouter = router;
