import { create } from "zustand";

interface PreviewState {
  previewText: string;
  fontSize: number;
  category: string | null;
  searchQuery: string;
  language: string | null;
  sort: string;
  setPreviewText: (text: string) => void;
  setFontSize: (size: number) => void;
  setCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setLanguage: (lang: string | null) => void;
  setSort: (sort: string) => void;
  resetAll: () => void;
}

const DEFAULT_PREVIEW = "پښتو ژبه زموږ د کلتور، ادب او ښکلا ژبه ده";

export const usePreviewState = create<PreviewState>((set) => ({
  previewText: DEFAULT_PREVIEW,
  fontSize: 32,
  category: null,
  searchQuery: "",
  language: null,
  sort: "popular",
  setPreviewText: (text) => set({ previewText: text }),
  setFontSize: (size) => set({ fontSize: size }),
  setCategory: (category) => set({ category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLanguage: (language) => set({ language }),
  setSort: (sort) => set({ sort }),
  resetAll: () =>
    set({
      previewText: DEFAULT_PREVIEW,
      fontSize: 32,
      category: null,
      searchQuery: "",
      language: null,
      sort: "popular",
    }),
}));
