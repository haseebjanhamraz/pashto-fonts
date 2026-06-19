import { z } from "zod";

export const getFontsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive().default(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 24))
    .pipe(z.number().int().positive().max(100).default(24)),
  search: z.string().optional(),
  category: z.string().optional(),
  language: z.enum(["pashto", "urdu", "arabic", "persian"]).optional(),
  sort: z.enum(["latest", "popular", "downloads", "name"]).default("popular"),
});

export type GetFontsQuery = z.infer<typeof getFontsQuerySchema>;
