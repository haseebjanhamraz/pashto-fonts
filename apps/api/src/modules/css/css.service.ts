import { prisma } from "../../utils/db";
import { redis } from "../../utils/redis";
import { parseFamilyParam, ParsedFontRequest } from "./css.parser";
import { FontStatus, FontFormat } from "@prisma/client";

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours caching for stylesheets

export class CssService {
  /**
   * Generates Google Fonts-style CSS content for requested families.
   * Leverages Redis cache to avoid hitting PostgreSQL on every request.
   */
  static async generateCss(familyParams: string | string[], display: string): Promise<string> {
    // Normalize parameter input to array of strings
    const families = Array.isArray(familyParams) ? familyParams : [familyParams];
    
    // Create sorted query string for consistent cache key hashing
    const sortedNormalizedQuery = [...families].sort().join("|") + `&display=${display}`;
    const cacheKey = `css-api:${sortedNormalizedQuery}`;

    // 1. Try resolving stylesheet from Redis cache
    try {
      const cachedCss = await redis.get(cacheKey);
      if (cachedCss) {
        console.log(`[CSS Service] Cache hit for query: ${sortedNormalizedQuery}`);
        return cachedCss;
      }
    } catch (err) {
      console.error("[CSS Service] Redis read failure:", err);
    }

    console.log(`[CSS Service] Cache miss for query: ${sortedNormalizedQuery}. Fetching from Database...`);

    // Parse requested weights and family names
    const parsedRequests: ParsedFontRequest[] = families.map((f) => parseFamilyParam(f));

    let cssOutput = "";

    // 2. Fetch and generate font-face blocks
    for (const req of parsedRequests) {
      const font = await prisma.font.findFirst({
        where: {
          name: { equals: req.familyName, mode: "insensitive" },
          status: FontStatus.PUBLISHED,
        },
        include: {
          files: true,
        },
      });

      if (!font) {
        cssOutput += `/* Font family '${req.familyName}' not found or is currently not published. */\n\n`;
        continue;
      }

      // Filter available files
      const availableFiles = font.files;
      if (availableFiles.length === 0) {
        cssOutput += `/* Font family '${font.name}' has no available files. */\n\n`;
        continue;
      }

      // Determine target weights
      let targetWeights = req.weights;
      if (targetWeights.length === 0) {
        // Default to first available weight or 400
        const defaultWeight = availableFiles.find((f) => f.weight === 400) ? 400 : availableFiles[0].weight;
        targetWeights = [defaultWeight];
      }

      // Generate @font-face for each target weight
      for (const w of targetWeights) {
        // Find best file for this weight (prefer WOFF2 format, then fallback)
        let file = availableFiles.find((f) => f.weight === w && f.format === FontFormat.WOFF2);
        if (!file) {
          file = availableFiles.find((f) => f.weight === w);
        }

        if (!file) {
          // If requested weight not found, find nearest available weight
          file = availableFiles.reduce((prev, curr) => 
            Math.abs(curr.weight - w) < Math.abs(prev.weight - w) ? curr : prev
          );
          cssOutput += `/* Requested weight ${w} not found for '${font.name}'. Falling back to nearest weight ${file.weight}. */\n`;
        }

        const formatStr = file.format.toLowerCase();
        
        cssOutput += `@font-face {\n`;
        cssOutput += `  font-family: "${font.name}";\n`;
        cssOutput += `  font-style: ${file.style.toLowerCase()};\n`;
        cssOutput += `  font-weight: ${file.weight};\n`;
        cssOutput += `  font-display: ${display};\n`;
        cssOutput += `  src: url("${file.fileUrl}") format("${formatStr}");\n`;
        cssOutput += `}\n\n`;
      }
    }

    // 3. Cache generated CSS in Redis
    try {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, cssOutput);
      console.log(`[CSS Service] Successfully cached CSS under key: ${cacheKey}`);
    } catch (err) {
      console.error("[CSS Service] Redis write failure:", err);
    }

    return cssOutput;
  }
}
