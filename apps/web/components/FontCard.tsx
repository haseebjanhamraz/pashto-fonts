"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Font } from "@/lib/api";
import styles from "./FontCard.module.css";

interface FontCardProps {
  font: Font;
  previewText: string;
  fontSize: number;
}

export default function FontCard({ font, previewText, fontSize }: FontCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isIntersected, setIsIntersected] = useState(false);
  const [copied, setCopied] = useState(false);

  // Find WOFF2 format or fall back to any webfont file
  const woff2File = font.files.find((f) => f.format === "WOFF2") || font.files[0];
  const fileUrl = woff2File?.fileUrl;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersected(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" } // Pre-load fonts 200px before they hit viewport
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isIntersected && fileUrl) {
      const styleId = `font-face-${font.slug}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        const formatStr = woff2File?.format ? woff2File.format.toLowerCase() : "woff2";
        // Injecting CSS Face
        style.innerHTML = `
          @font-face {
            font-family: "${font.name}";
            src: url("${fileUrl}") format("${formatStr}");
            font-display: swap;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [isIntersected, fileUrl, font.name, font.slug]);

  const handleCopyCss = () => {
    const embedCode = `<link href="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/css2?family=${encodeURIComponent(font.name)}&display=swap" rel="stylesheet">`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/fonts/${font.slug}/download`);
  };

  return (
    <div ref={cardRef} className={styles.card}>
      <div>
        <div className={styles.header}>
          <div>
            <h2 className={styles.fontName}>{font.name}</h2>
            <div className={styles.metaInfo}>
              <span className={styles.designer}>{font.designer || "نامعلوم ډيزاینر"}</span>
              <span className={styles.badge}>{font.category?.name || "عام"}</span>
            </div>
          </div>
          <div className={styles.tagGroup}>
            {font.supportsPashto && <span className={styles.langBadge}>پښتو</span>}
            {font.supportsUrdu && <span className={styles.langBadge}>اردو</span>}
            {font.supportsArabic && <span className={styles.langBadge}>عربي</span>}
          </div>
        </div>

        {/* Dynamic preview with lazy-loaded font-family */}
        <div
          className={`${styles.previewText} font-preview`}
          style={{
            fontFamily: isIntersected ? `"${font.name}", var(--font-fallback-rtl)` : "var(--font-fallback-rtl)",
            fontSize: `${fontSize}px`,
          }}
        >
          {previewText}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.metaInfo}>
          <span>{font.downloadCount} ډاونلوډونه</span>
        </div>
        <div className={styles.btnGroup}>
          <Link href={`/fonts/${font.slug}`} className={styles.btn}>
            تفصیل وګورئ
          </Link>
          <button className={styles.btn} onClick={handleCopyCss}>
            {copied ? "کاپي شو!" : "کاپي CSS"}
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownload}>
            ډاونلوډ
          </button>
        </div>
      </div>
    </div>
  );
}
