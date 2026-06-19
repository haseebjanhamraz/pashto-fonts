export interface ParsedFontRequest {
  familyName: string;
  weights: number[];
}

/**
 * Parses family query parameter strings.
 * Example inputs:
 * - "BBC Reith Qalam" -> { familyName: "BBC Reith Qalam", weights: [] }
 * - "BBC Reith Qalam:wght@400" -> { familyName: "BBC Reith Qalam", weights: [400] }
 * - "BBC Reith Qalam:wght@400;700" -> { familyName: "BBC Reith Qalam", weights: [400, 700] }
 */
export function parseFamilyParam(familyStr: string): ParsedFontRequest {
  const parts = familyStr.split(":");
  const familyName = parts[0].trim();
  const weights: number[] = [];

  if (parts.length > 1) {
    const wghtSpec = parts[1]; // e.g. "wght@400;700"
    if (wghtSpec.startsWith("wght@")) {
      const weightParts = wghtSpec.replace("wght@", "").split(";");
      for (const w of weightParts) {
        const parsedWeight = parseInt(w, 10);
        if (!isNaN(parsedWeight)) {
          weights.push(parsedWeight);
        }
      }
    }
  }

  return {
    familyName,
    weights,
  };
}
