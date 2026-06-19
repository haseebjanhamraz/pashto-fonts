// Shared Enum and Type Definitions for Pashto Fonts

export enum FontStatus {
  DRAFT = "DRAFT",
  PROCESSING = "PROCESSING",
  PUBLISHED = "PUBLISHED",
  PRIVATE = "PRIVATE",
  ARCHIVED = "ARCHIVED",
  ERROR = "ERROR",
}

export enum FontStyle {
  NORMAL = "NORMAL",
  ITALIC = "ITALIC",
  OBLIQUE = "OBLIQUE",
}

export enum FontFormat {
  TTF = "TTF",
  OTF = "OTF",
  WOFF = "WOFF",
  WOFF2 = "WOFF2",
}

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
}

export interface FontMetadata {
  id: string;
  name: string;
  slug: string;
  description?: string;
  designer?: string;
  publisher?: string;
  sourceUrl?: string;
  license: string;
  categoryId?: string;
  status: FontStatus;
  isFeatured: boolean;
  isVariable: boolean;
  supportsPashto: boolean;
  supportsUrdu: boolean;
  supportsArabic: boolean;
  supportsPersian: boolean;
  viewCount: number;
  downloadCount: number;
  embedLoadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
