import { exec } from "child_process";
import path from "path";
import fs from "fs";
import util from "util";
import ttf2woff2 from "ttf2woff2";
import { prisma } from "../utils/db";
import { StorageService } from "../services/storage";
import { FontStatus, FontFormat, FontStyle } from "@prisma/client";
import { redis } from "../utils/redis";

const execPromise = util.promisify(exec);

async function setProgress(fontId: string, progress: number, estimatedRemainingSeconds: number, step: string) {
  try {
    const key = `font:progress:${fontId}`;
    await redis.set(
      key,
      JSON.stringify({
        progress,
        estimatedRemainingSeconds,
        step,
        updatedAt: new Date().toISOString(),
      }),
      "EX",
      300 // Expire in 5 minutes
    );
  } catch (err) {
    console.error(`[FontProcessor] Redis set progress error:`, err);
  }
}

export class FontProcessor {
  /**
   * Main processor logic for font processing.
   */
  static async processFont(fontId: string, filePath: string, originalFilename: string) {
    console.log(`[FontProcessor] Starting processing for Font ID: ${fontId}, path: ${filePath}`);
    
    // Check if the font record exists
    const fontRecord = await prisma.font.findUnique({ where: { id: fontId } });
    if (!fontRecord) {
      throw new Error(`Font record not found for ID: ${fontId}`);
    }

    try {
      await setProgress(fontId, 5, 10, "د فایل تحلیل پیل شو (Font analysis started)");

      // 1. Run Python Analysis Script
      const scriptPath = path.join(__dirname, "../../scripts/analyze-font.py");
      // Escape paths for safety on windows
      const command = `python "${scriptPath}" "${filePath.replace(/\\/g, "\\\\")}"`;
      
      console.log(`[FontProcessor] Running command: ${command}`);
      const { stdout } = await execPromise(command);
      
      const analysisResult = JSON.parse(stdout.trim());
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || "Python font analysis failed.");
      }

      console.log(`[FontProcessor] Analysis successful:`, analysisResult);
      await setProgress(fontId, 30, 7, "د فونټ معلومات استخراج شول (Metadata extracted)");

      const ext = path.extname(filePath).toLowerCase();
      const originalFormat = ext === ".otf" ? FontFormat.OTF : FontFormat.TTF;
      const weight = analysisResult.weight;
      const style = analysisResult.style as FontStyle;
      const fontSlug = fontRecord.slug;

      // 2. Generate WOFF2 file
      console.log(`[FontProcessor] Generating WOFF2 file...`);
      const originalBuffer = fs.readFileSync(filePath);
      const woff2Buffer = ttf2woff2(originalBuffer);
      
      const woff2Path = filePath + ".woff2";
      fs.writeFileSync(woff2Path, woff2Buffer);
      await setProgress(fontId, 55, 5, "ویب فونټ WOFF2 جوړ شو (WOFF2 font compiled)");

      // 3. Upload Original Font File to S3
      console.log(`[FontProcessor] Uploading original font file to storage...`);
      const originalKey = `fonts/${fontSlug}/original-${weight}-${style.toLowerCase()}${ext}`;
      const originalUrl = await StorageService.uploadFile(
        filePath,
        originalKey,
        "font/ttf" // or font/otf
      );
      await setProgress(fontId, 75, 3, "اصلي فایل اپلوډ شو (Original file uploaded)");

      // 4. Upload WOFF2 file to S3
      console.log(`[FontProcessor] Uploading WOFF2 webfont file to storage...`);
      const woff2Key = `fonts/${fontSlug}/web-${weight}-${style.toLowerCase()}.woff2`;
      const woff2Url = await StorageService.uploadFile(
        woff2Path,
        woff2Key,
        "font/woff2"
      );
      await setProgress(fontId, 90, 1, "ویب فونټ اپلوډ شو (Webfont uploaded)");

      // 5. Update Font metadata and set status to DRAFT
      console.log(`[FontProcessor] Updating database metadata...`);
      await prisma.$transaction(async (tx) => {
        // Update font main attributes
        await tx.font.update({
          where: { id: fontId },
          data: {
            name: analysisResult.familyName,
            designer: analysisResult.designer || "Unknown",
            publisher: analysisResult.publisher || "Unknown",
            supportsPashto: analysisResult.supportsPashto,
            supportsUrdu: analysisResult.supportsUrdu,
            supportsArabic: analysisResult.supportsArabic,
            supportsPersian: analysisResult.supportsPersian,
            status: FontStatus.DRAFT, // processed successfully, awaits admin review/publishing
          },
        });

        // Insert FontFile for original
        await tx.fontFile.create({
          data: {
            fontId,
            weight,
            style,
            format: originalFormat,
            fileUrl: originalUrl,
            storageKey: originalKey,
            fileSize: fs.statSync(filePath).size,
            originalFilename,
            isWebFont: false,
          },
        });

        // Insert FontFile for WOFF2
        await tx.fontFile.create({
          data: {
            fontId,
            weight,
            style,
            format: FontFormat.WOFF2,
            fileUrl: woff2Url,
            storageKey: woff2Key,
            fileSize: fs.statSync(woff2Path).size,
            originalFilename: `${path.parse(originalFilename).name}.woff2`,
            isWebFont: true,
          },
        });
      });

      console.log(`[FontProcessor] Font processing completed successfully for ID: ${fontId}`);
      await setProgress(fontId, 100, 0, "پروسس په بریالیتوب سره بشپړ شو (Processing completed)");

      // 6. Cleanup local temporary files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (fs.existsSync(woff2Path)) fs.unlinkSync(woff2Path);
      
    } catch (error: any) {
      console.error(`[FontProcessor] Failed to process font ${fontId}:`, error);
      await setProgress(fontId, 0, 0, `تېروتنه رامنځته شوه: ${error.message || "پروسس ناکام شو"} (Error occurred)`);
      
      // Update font status to ERROR in database
      await prisma.font.update({
        where: { id: fontId },
        data: {
          status: FontStatus.ERROR,
        },
      });

      // Cleanup local files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const woff2Path = filePath + ".woff2";
      if (fs.existsSync(woff2Path)) fs.unlinkSync(woff2Path);

      throw error;
    }
  }
}
