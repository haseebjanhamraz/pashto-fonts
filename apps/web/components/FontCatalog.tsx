"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePreviewState } from "@/hooks/usePreviewState";
import { fetchFonts } from "@/lib/api";
import FontCard from "./FontCard";
import styles from "./FontCatalog.module.css";

export default function FontCatalog() {
  const [page, setPage] = useState(1);
  const { searchQuery, category, language, sort, previewText, fontSize } = usePreviewState();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, category, language, sort]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["fonts", { page, searchQuery, category, language, sort }],
    queryFn: () =>
      fetchFonts({
        page,
        limit: 12,
        search: searchQuery || undefined,
        category,
        language,
        sort,
      }),
  });

  if (isLoading) {
    return (
      <section className={styles.catalogSection}>
        <div className={styles.container}>
          <div className={styles.loadingWrapper}>
            <div className={styles.loadingSpinner}></div>
            <h3 className={styles.title}>فونټونه پورته کیږي...</h3>
            <p className={styles.desc}>مهرباني وکړئ یو څو شیبې انتظار وکړئ.</p>
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
            <h3 className={styles.title}>تېروتنه رامنځته شوه!</h3>
            <p className={styles.desc}>د فونټونو په پورته کولو کې ستونزه ده. مهرباني وکړئ وروسته هڅه وکړئ.</p>
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
            <h3 className={styles.title}>هيڅ فونټ ونه موندل شو</h3>
            <p className={styles.desc}>ستاسو د لټون لپاره کوم فونټ شتون نلري.</p>
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
              مخکینی
            </button>
            <span className={styles.pageIndicator}>
              پاڼه {page} له {pagination.totalPages} څخه
            </span>
            <button
              className={styles.pageBtn}
              onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
              disabled={page === pagination.totalPages}
            >
              بل
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
