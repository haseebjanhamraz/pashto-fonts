const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface FontFile {
  id: string;
  weight: number;
  style: "NORMAL" | "ITALIC" | "OBLIQUE";
  format: "TTF" | "OTF" | "WOFF" | "WOFF2";
  fileUrl: string;
  storageKey: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Font {
  id: string;
  name: string;
  slug: string;
  description?: string;
  designer?: string;
  publisher?: string;
  sourceUrl?: string;
  license: string;
  categoryId?: string;
  category?: Category;
  supportsPashto: boolean;
  supportsUrdu: boolean;
  supportsArabic: boolean;
  supportsPersian: boolean;
  viewCount: number;
  downloadCount: number;
  createdAt: string;
  files: FontFile[];
}

export interface PaginatedFontsResponse {
  success: boolean;
  data: Font[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export async function fetchFonts(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string | null;
  language?: string | null;
  sort?: string;
}): Promise<PaginatedFontsResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.language) query.append("language", params.language);
  if (params.sort) query.append("sort", params.sort);

  const res = await fetch(`${API_BASE_URL}/api/fonts?${query.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch fonts");
  }
  return res.json();
}

export async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch(`${API_BASE_URL}/api/categories`);
  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }
  return res.json();
}

export async function fetchFontDetail(slug: string): Promise<{ success: boolean; data: Font }> {
  const res = await fetch(`${API_BASE_URL}/api/fonts/${slug}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch font: ${slug}`);
  }
  return res.json();
}
