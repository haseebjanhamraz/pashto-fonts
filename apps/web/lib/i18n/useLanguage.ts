"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { en } from "./dictionaries/en";
import { ps } from "./dictionaries/ps";
import { useEffect, useState } from "react";

export type Language = "en" | "ps";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "en", // English is the default language
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "language-storage",
    }
  )
);

const dictionaries = {
  en,
  ps,
};

export function useLanguage() {
  const { language, setLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = (path: string): string => {
    const keys = path.split(".");
    // Use "en" during SSR and before mounting to avoid hydration warnings
    const activeLang = mounted ? language : "en";
    let current: any = dictionaries[activeLang];
    
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        return path;
      }
    }
    return typeof current === "string" ? current : path;
  };

  const isRtl = mounted ? language === "ps" : false;

  const syncLangAttributes = () => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = language === "ps" ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  };

  useEffect(() => {
    if (mounted) {
      syncLangAttributes();
    }
  }, [mounted, language]);

  return { language, setLanguage, t, isRtl, syncLangAttributes };
}
