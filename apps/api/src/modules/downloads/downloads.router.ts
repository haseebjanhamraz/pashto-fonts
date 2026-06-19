import { Router, Request, Response } from "express";
import AdmZip from "adm-zip";
import { prisma } from "../../utils/db";
import { FontStatus, FontFormat } from "@prisma/client";
import { rateLimiter } from "../../middlewares/rate-limit.middleware";
import { fetchFromS3 } from "../../utils/s3";

const router = Router();

// ─── Credits / README generator ──────────────────────────────────────────────

function generateCredits(font: {
  name: string;
  designer: string | null;
  publisher: string | null;
  license: string | null;
  sourceUrl: string | null;
  description: string | null;
  category: { name: string } | null;
}): string {
  const line = "=".repeat(60);
  const thin = "-".repeat(60);
  const now = new Date().toUTCString();

  const rows: (string | null)[] = [
    line,
    "  PASHTO FONTS — Free & Open-Source RTL Font Repository",
    "  https://pashtofonts.com",
    line,
    "",
    `  Font Name  : ${font.name}`,
    `  Designer   : ${font.designer || "Unknown"}`,
    `  Publisher  : ${font.publisher || "Unknown"}`,
    `  Category   : ${font.category?.name || "Uncategorized"}`,
    `  License    : ${font.license || "Open Source — Free to use"}`,
    font.sourceUrl ? `  Source     : ${font.sourceUrl}` : null,
    font.description ? `  About      : ${font.description}` : null,
    `  Downloaded : ${now}`,
    "",
    thin,
    "  INSTALLATION INSTRUCTIONS",
    thin,
    "",
    "  Windows:",
    "    1. Right-click the .ttf / .otf file",
    "    2. Select 'Install for all users' (recommended) or 'Install'",
    "    3. The font is now available in all applications",
    "",
    "  macOS:",
    "    1. Double-click the .ttf / .otf file",
    "    2. Click 'Install Font' in Font Book",
    "    3. The font is immediately available system-wide",
    "",
    "  Linux (Ubuntu / Debian):",
    "    1. Copy the font file(s) to ~/.local/share/fonts/",
    "       or /usr/share/fonts/ for system-wide installation",
    "    2. Run:  fc-cache -f -v",
    "    3. Restart your application",
    "",
    "  Web Embedding (HTML):",
    "    Copy the <link> tag from pashtofonts.com/fonts and",
    "    paste it into the <head> of your HTML document.",
    `    Then in CSS:  font-family: "${font.name}";`,
    "",
    thin,
    "  RTL USAGE TIPS",
    thin,
    "",
    "  For Pashto, Dari, or Arabic text add these CSS rules:",
    "",
    "    direction: rtl;",
    "    unicode-bidi: plaintext;",
    "    text-align: right;",
    `    font-family: "${font.name}", serif;`,
    "",
    "  HTML attribute:  <p dir=\"rtl\" lang=\"ps\">...</p>",
    "",
    thin,
    "  LICENSE",
    thin,
    "",
    "  This font is Open Source and free for personal and commercial",
    "  use. Redistribution is permitted as long as this credits file",
    "  is included.",
    "",
    `  Full license: ${font.sourceUrl || "https://pashtofonts.com"}`,
    "",
    line,
    "  Thank you for using Pashto Fonts!",
    "  Help us grow: share pashtofonts.com with your community.",
    line,
    "",
  ];

  return rows.filter((l): l is string => l !== null).join("\n");
}

// ─── @font-face CSS generator ─────────────────────────────────────────────────

type FileEntry = {
  originalFilename: string | null;
  weight: number;
  format: string;
  style: string;
  fileUrl: string;
};

function generateCss(
  fontName: string,
  fontSlug: string,
  files: FileEntry[],
  useRelativePaths: boolean
): string {
  let css = `/**\n`;
  css += ` * Font: ${fontName}\n`;
  css += ` * Source: https://pashtofonts.com\n`;
  css += ` * License: Open Source — Free to use and redistribute\n`;
  css += ` */\n\n`;

  for (const file of files) {
    const fileName =
      file.originalFilename ||
      `${fontSlug}-${file.weight}.${file.format.toLowerCase()}`;
    const src = useRelativePaths ? `./${fileName}` : file.fileUrl;

    css += `@font-face {\n`;
    css += `  font-family: "${fontName}";\n`;
    css += `  font-style: ${file.style.toLowerCase()};\n`;
    css += `  font-weight: ${file.weight};\n`;
    css += `  src: url("${src}") format("${file.format.toLowerCase()}");\n`;
    css += `  font-display: swap;\n`;
    css += `}\n\n`;
  }

  return css;
}

// ─── Helper: build ZIP from a set of files ────────────────────────────────────

interface ZipFileSpec {
  entry: FileEntry;
  buffer: Buffer;
}

function buildZip(
  fontName: string,
  fontSlug: string,
  fileSpecs: ZipFileSpec[],
  creditsContent: string,
  useRelativePaths: boolean
): AdmZip {
  const zip = new AdmZip();
  const folder = fontSlug;

  const filesForCss: FileEntry[] = [];

  for (const { entry, buffer } of fileSpecs) {
    const filename =
      entry.originalFilename ||
      `${fontSlug}-${entry.weight}.${entry.format.toLowerCase()}`;
    zip.addFile(`${folder}/${filename}`, buffer);
    filesForCss.push(entry);
  }

  const css = generateCss(fontName, fontSlug, filesForCss, useRelativePaths);
  zip.addFile(`${folder}/stylesheet.css`, Buffer.from(css, "utf-8"));
  zip.addFile(`${folder}/credits.txt`, Buffer.from(creditsContent, "utf-8"));

  return zip;
}

// ─── Route ────────────────────────────────────────────────────────────────────

// GET /api/fonts/:slug/download?format=zip|woff2|original|css
router.get("/:slug/download", rateLimiter(20, 60), async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { format = "zip" } = req.query as { format?: string };

    const font = await prisma.font.findUnique({
      where: { slug },
      include: { category: true, files: true },
    });

    if (!font || font.status !== FontStatus.PUBLISHED) {
      return res.status(404).json({
        success: false,
        error: { code: "FONT_NOT_FOUND", message: "Font not found or not published." },
      });
    }

    if (font.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_FILES_AVAILABLE", message: "No files are associated with this font." },
      });
    }

    // Increment download count asynchronously
    prisma.font
      .update({ where: { id: font.id }, data: { downloadCount: { increment: 1 } } })
      .catch((err) => console.error(`[Downloads] Failed to increment count for ${slug}:`, err));

    const credits = generateCredits(font);

    // ── CSS stylesheet only ───────────────────────────────────────────────────
    if (format === "css") {
      const zip = new AdmZip();
      const folder = font.slug;
      const css = generateCss(font.name, font.slug, font.files, false); // CDN URLs
      zip.addFile(`${folder}/stylesheet.css`, Buffer.from(css, "utf-8"));
      zip.addFile(`${folder}/credits.txt`, Buffer.from(credits, "utf-8"));

      const buf = zip.toBuffer();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${font.slug}-css.zip"`);
      res.setHeader("Content-Length", buf.length);
      return res.status(200).send(buf);
    }

    // ── WOFF2 webfont only ────────────────────────────────────────────────────
    if (format === "woff2") {
      const woff2File = font.files.find((f) => f.format === FontFormat.WOFF2);
      if (!woff2File) {
        return res.status(404).json({
          success: false,
          error: { code: "FORMAT_NOT_FOUND", message: "No WOFF2 file available for this font." },
        });
      }

      console.log(`[Downloads] Fetching WOFF2 for: ${font.name}`);
      const buf = await fetchFromS3(woff2File.fileUrl);
      if (!buf) {
        return res.status(502).json({
          success: false,
          error: { code: "FETCH_FAILED", message: "Could not retrieve WOFF2 file from storage." },
        });
      }

      const zip = buildZip(font.name, font.slug, [{ entry: woff2File, buffer: buf }], credits, true);
      const zipBuf = zip.toBuffer();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${font.slug}-woff2.zip"`);
      res.setHeader("Content-Length", zipBuf.length);
      return res.status(200).send(zipBuf);
    }

    // ── Original format (TTF / OTF / WOFF) ───────────────────────────────────
    if (format === "original") {
      // Prefer non-WOFF2 files; fall back to WOFF2 if that's all we have
      const origFile =
        font.files.find((f) => f.format !== FontFormat.WOFF2) ||
        font.files[0];

      console.log(`[Downloads] Fetching original (${origFile.format}) for: ${font.name}`);
      const buf = await fetchFromS3(origFile.fileUrl);
      if (!buf) {
        return res.status(502).json({
          success: false,
          error: { code: "FETCH_FAILED", message: "Could not retrieve original font file from storage." },
        });
      }

      const zip = buildZip(font.name, font.slug, [{ entry: origFile, buffer: buf }], credits, true);
      const zipBuf = zip.toBuffer();
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${font.slug}-${origFile.format.toLowerCase()}.zip"`
      );
      res.setHeader("Content-Length", zipBuf.length);
      return res.status(200).send(zipBuf);
    }

    // ── Default: full ZIP pack (all files) ────────────────────────────────────
    console.log(`[Downloads] Building full ZIP pack for: ${font.name}`);

    const fileSpecs: ZipFileSpec[] = [];

    await Promise.all(
      font.files.map(async (file) => {
        const buf = await fetchFromS3(file.fileUrl);
        if (buf) {
          fileSpecs.push({ entry: file, buffer: buf });
        } else {
          console.warn(`[Downloads] Could not fetch file: ${file.fileUrl}`);
        }
      })
    );

    if (fileSpecs.length === 0) {
      return res.status(502).json({
        success: false,
        error: {
          code: "FETCH_FAILED",
          message: "Could not retrieve any font files from storage.",
        },
      });
    }

    const zip = buildZip(font.name, font.slug, fileSpecs, credits, true);
    const zipBuffer = zip.toBuffer();

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
