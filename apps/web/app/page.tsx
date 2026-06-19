"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchFonts } from "@/lib/api";
import Header from "@/components/Header";
import FontCard from "@/components/FontCard";
import { useLanguage } from "@/lib/i18n/useLanguage";
import styles from "./page.module.css";

export default function Home() {
  const { t } = useLanguage();

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Fetch featured fonts
  const { data: fontsData } = useQuery({
    queryKey: ["featured-fonts"],
    queryFn: () =>
      fetchFonts({
        page: 1,
        limit: 3,
        sort: "popular",
      }),
  });

  const categories = categoriesData?.data || [];
  const featuredFonts = fontsData?.data || [];

  return (
    <>
      <Header />

      <main style={{ flexGrow: 1 }}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContainer}>
            <h1 className={styles.title}>
              {t("home.heroTitle")}
            </h1>
            <p className={styles.subtitle}>
              {t("home.heroSubtitle")}
            </p>
            <div className={styles.ctaGroup}>
              <Link href="/fonts" className={`${styles.btn} ${styles.btnPrimary}`}>
                {t("home.exploreFonts")}
              </Link>
              <a href="#developer-embed" className={`${styles.btn} ${styles.btnSecondary}`}>
                {t("home.embedWebFont")}
              </a>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>{t("home.fontCategories")}</h2>
            <p className={styles.sectionDesc}>{t("home.categoriesDesc")}</p>

            <div className={styles.categoryGrid}>
              {categories.slice(0, 8).map((cat) => (
                <Link key={cat.id} href={`/fonts?category=${cat.slug}`} className={styles.categoryCard}>
                  <h3 className={styles.catName}>{cat.name}</h3>
                  <p className={styles.catDesc}>{cat.description || t("home.categoryCardDesc")}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>{t("home.featuredFonts")}</h2>
            <p className={styles.sectionDesc}>{t("home.featuredDesc")}</p>

            <div className={styles.featuredGrid}>
              {featuredFonts.map((font) => (
                <FontCard
                  key={font.id}
                  font={font}
                  previewText="پښتو ژبه زموږ د کلتور، ادب او ښکلا ژبه ده"
                  fontSize={28}
                />
              ))}
            </div>
            {featuredFonts.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                {t("home.noFonts")}
              </p>
            )}
          </div>
        </section>

        {/* Developer Integration Section */}
        <section id="developer-embed" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <div className={styles.developerCta}>
              <div className={styles.devInfo}>
                <h2 className={styles.devTitle}>{t("home.devIntegration")}</h2>
                <p className={styles.devDesc}>
                  {t("home.devIntegrationDesc")}
                </p>
              </div>

              <div className={styles.codeBlock}>
                {`<!-- HTML context -->
<link href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/css2?family=BBC+Reith+Qalam&display=swap" rel="stylesheet">

/* CSS context */
body {
  font-family: "BBC Reith Qalam", sans-serif;
}`}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <p>{t("home.footerCopy")}</p>
          <p className={styles.footerText}>
            {t("home.footerText")}
          </p>
        </div>
      </footer>
    </>
  );
}
