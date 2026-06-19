"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";
import styles from "./Header.module.css";

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (stored) {
      setIsAdmin(true);
    }
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoArea}>
          <Link href="/" className={styles.logoTitle}>
            {t("common.logoTitle")}
          </Link>
          <span className={styles.logoBadge}>PRO</span>
        </div>

        <nav className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>
            {t("common.home")}
          </Link>
          <Link href="/fonts" className={styles.navLink}>
            {t("common.fonts")}
          </Link>
          <Link href="/categories" className={styles.navLink}>
            {t("common.categories")}
          </Link>
          <Link href="/api-docs" className={styles.navLink}>
            {t("common.developerApi")}
          </Link>
        </nav>

        <div className={styles.langActions}>
          <button
            onClick={() => setLanguage(language === "en" ? "ps" : "en")}
            className={styles.langBtn}
            title={language === "en" ? "پښتو ته اوښتل" : "Switch to English"}
          >
            {language === "en" ? "پښتو" : "English"}
          </button>
          
          <Link href={isAdmin ? "/admin/dashboard" : "/admin/login"} className={styles.ctaButton}>
            {t("common.adminPanel")}
          </Link>
        </div>
      </div>
    </header>
  );
}
