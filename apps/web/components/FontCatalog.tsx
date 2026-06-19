"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePreviewState } from "@/hooks/usePreviewState";
import { fetchFonts } from "@/lib/api";
import { useLanguage } from "@/lib/i18n/useLanguage";
import FontCard from "./FontCard";
import styles from "./FontCatalog.module.css";

export default function FontCatalog() {
  const { language, t } = useLanguage();
  const [page, setPage] = useState(1);
  const { searchQuery, category, language: filterLang, sort, previewText, fontSize } = usePreviewState();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, category, filterLang, sort]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["fonts", { page, searchQuery, category, language: filterLang, sort }],
    queryFn: () =>
      fetchFonts({
        page,
        limit: 12,
        search: searchQuery || undefined,
        category,
        language: filterLang,
        sort,
      }),
  });

  if (isLoading) {
    return (
      <section className={styles.catalogSection}>
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>
            <div className={styles.loadingSpinner}></div>
            <h3 className={styles.title}>
              {language === "ps" ? "فونټونه پورته کیږي..." : "Loading fonts..."}
            </h3>
            <p className={styles.desc}>
              {language === "ps" ? "مهرباني وکړئ یو څو شیبې انتظار وکړئ." : "Please wait a moment."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className={styles.catalogSection}>
        <div className={styles.container}>
          <div className={styles.errorWrapper}>
            <h3 className={styles.title}>{t("common.error")}</h3>
            <p className={styles.desc}>
              {language === "ps" ? "د فونټونو په پورته کولو کې ستونزه ده. مهرباني وکړئ وروسته هڅه وکړئ." : "Failed to load fonts list. Please try again later."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const fonts = data?.data || [];
  const pagination = data?.pagination;

  if (fonts.length === 0) {
    return (
      <section className={styles.catalogSection}>
        <div className={styles.container}>
          <div className={styles.emptyWrapper}>
            <h3 className={styles.title}>{t("fonts.noFontsFound")}</h3>
            <p className={styles.desc}>
              {language === "ps" ? "ستاسو د لټون لپاره کوم فونټ شتون نلري." : "There are no fonts matching your search filters."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.catalogSection}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {fonts.map((font) => (
            <FontCard
              key={font.id}
              font={font}
              previewText={previewText}
              fontSize={fontSize}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              {language === "ps" ? "مخکینی" : "Previous"}
            </button>
            <span className={styles.pageIndicator}>
              {language === "ps"
                ? `پاڼه ${page} له ${pagination.totalPages} څخه`
                : `Page ${page} of ${pagination.totalPages}`}
            </span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
            >
              {language === "ps" ? "بل" : "Next"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
