"use client";

import { useQuery } from "@tanstack/react-query";
import { usePreviewState } from "@/hooks/usePreviewState";
import { fetchCategories } from "@/lib/api";
import styles from "./PreviewControls.module.css";

export default function PreviewControls() {
  const {
    previewText,
    fontSize,
    category,
    searchQuery,
    language,
    sort,
    setPreviewText,
    setFontSize,
    setCategory,
    setSearchQuery,
    setLanguage,
    setSort,
    resetAll,
  } = usePreviewState();

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const categories = categoriesData?.data || [];

  return (
    <div className={styles.controls}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          {/* Search Bar */}
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="د فونټ نوم وپلټئ..."
              className={styles.input}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Real-time Preview Text Input */}
          <div className={styles.previewTextWrapper}>
            <input
              type="text"
              placeholder="دلته خپل پښتو متن ولیکئ ترڅو فونټونه پکې وګورئ..."
              className={`${styles.input} ${styles.previewInput}`}
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.filterGroup}>
            {/* Category Filter */}
            <select
              className={styles.select}
              value={category || ""}
              onChange={(e) => setCategory(e.target.value || null)}
            >
              <option value="">ټول کټګورۍ</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Language Filter */}
            <select
              className={styles.select}
              value={language || ""}
              onChange={(e) => setLanguage(e.target.value || null)}
            >
              <option value="">ټولې ژبې</option>
              <option value="pashto">پښتو (Pashto)</option>
              <option value="urdu">اردو (Urdu)</option>
              <option value="arabic">عربي (Arabic)</option>
              <option value="persian">فارسي (Persian)</option>
            </select>

            {/* Sort Filter */}
            <select
              className={styles.select}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="popular">ترټولو مشهور</option>
              <option value="downloads">ډیر ډاونلوډ شوي</option>
              <option value="latest">نوي اضافه شوي</option>
              <option value="name">الفبا (نوم)</option>
            </select>
          </div>

          {/* Font Size Slider */}
          <div className={styles.filterGroup}>
            <div className={styles.sliderWrapper}>
              <span className={styles.sliderLabel}>{fontSize}px</span>
              <input
                type="range"
                min="12"
                max="96"
                className={styles.slider}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              />
            </div>

            {/* Reset Button */}
            <button className={styles.resetBtn} onClick={resetAll}>
              ↺ بیا تنظیمول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
