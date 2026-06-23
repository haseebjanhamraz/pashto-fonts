"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/api";
import Header from "@/components/Header";
import { useLanguage } from "@/lib/i18n/useLanguage";
import styles from "./page.module.css";

export default function CategoriesPage() {
  const { t, language } = useLanguage();

  const { data: categoriesData, isLoading, isError, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const categories = categoriesData?.data || [];
  const isRtl = language === "ps";

  return (
    <>
      <Header />

      <main className={styles.container} style={{ flexGrow: 1 }}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{t("home.fontCategories")}</h1>
          <p className={styles.subtitle}>{t("home.categoriesDesc")}</p>
        </div>

        {isLoading && (
          <div className={styles.loadingContainer}>
            <p>{t("common.loading")}</p>
          </div>
        )}

        {isError && (
          <div className={styles.errorContainer}>
            <p>{t("common.error")}</p>
            <button onClick={() => refetch()} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className={styles.grid}>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/fonts?category=${cat.slug}`}
                className={styles.card}
              >
                <div className={styles.cardHeader}>
                  <h2 className={styles.catName}>{cat.name}</h2>
                  <p className={styles.catDesc}>
                    {cat.description || t("home.categoryCardDesc")}
                  </p>
                </div>
                <div className={styles.cardFooter}>
                  <span>{t("home.categoryCardDesc")}</span>
                  <span className={styles.arrow}>{isRtl ? "←" : "→"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className={styles.footer} style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--color-bg-secondary)",
        padding: "var(--spacing-2xl) 0",
        textAlign: "center",
        fontSize: "0.9rem"
      }}>
        <div className="container">
          <p>{t("home.footerCopy")}</p>
          <p style={{ color: "var(--color-text-muted)", marginTop: "var(--spacing-sm)" }}>
            {t("home.footerText")}
          </p>
        </div>
      </footer>
    </>
  );
}
