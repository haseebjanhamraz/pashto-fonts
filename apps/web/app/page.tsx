"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchFonts } from "@/lib/api";
import Header from "@/components/Header";
import FontCard from "@/components/FontCard";
import styles from "./page.module.css";

export default function Home() {
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
              د ویب پاڼو، ډیزاین او خپرونو لپاره ښکلي{" "}
              <span className={styles.titleAccent}>پښتو فونټونه</span>
            </h1>
            <p className={styles.subtitle}>
              پښتو فونټونه د پښتو او عربي متنونو د لټون، کتنې، ډاونلوډ او په ویب پاڼه کې د ځای پر ځای کولو لپاره د ګوګل فونټس په څیر یو خپلواک او خلاص سرچینه پلیټ فارم دی.
            </p>
            <div className={styles.ctaGroup}>
              <Link href="/fonts" className={`${styles.btn} ${styles.btnPrimary}`}>
                د فونټونو پلټنه کول
              </Link>
              <a href="#developer-embed" className={`${styles.btn} ${styles.btnSecondary}`}>
                ویب فونټ ځای پر ځای کول
              </a>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <h2 className={styles.sectionTitle}>د فونټونو کټګورۍ</h2>
            <p className={styles.sectionDesc}>پښتو او عربي خطونه په مختلفو کټګوریو او سټایلونو کې وپلټئ.</p>

            <div className={styles.categoryGrid}>
              {categories.slice(0, 8).map((cat) => (
                <Link key={cat.id} href={`/fonts?category=${cat.slug}`} className={styles.categoryCard}>
                  <h3 className={styles.catName}>{cat.name}</h3>
                  <p className={styles.catDesc}>{cat.description || "د دې کټګورۍ خطونه وګورئ."}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>غوره شوي فونټونه</h2>
            <p className={styles.sectionDesc}>زموږ په ټولنه کې د ډیرو کارول شویو او مشهورو پښتو فونټونو ټولګه.</p>

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
                هیڅ فونټ نشته. فونټونه د اداري تختې له لارې اضافه کړئ.
              </p>
            )}
          </div>
        </section>

        {/* Developer Integration Section */}
        <section id="developer-embed" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <div className={styles.developerCta}>
              <div className={styles.devInfo}>
                <h2 className={styles.devTitle}>د ویب پاڼې پرمخ وړونکو (ډیولپرز) لپاره ادغام</h2>
                <p className={styles.devDesc}>
                  خپلو ویب پاڼو ته په اسانۍ سره پښتو فونټونه ورګډ کړئ. یوازې لاندې لینک په خپل HTML کې کاپي کړئ او په خپل CSS کې د خط کورنۍ واخلئ:
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
          <p>© 2026 پښتو فونټونه. ټول حقوق خوندي دي.</p>
          <p className={styles.footerText}>
            ټول فونټونه خلاص سرچینه دي او د عامه کارولو او ډاونلوډ لپاره وړیا دي.
          </p>
        </div>
      </footer>
    </>
  );
}
