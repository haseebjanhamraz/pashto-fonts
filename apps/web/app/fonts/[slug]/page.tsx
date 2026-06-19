"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchFontDetail } from "@/lib/api";
import Header from "@/components/Header";
import styles from "../font-detail.module.css";

const DEFAULT_PREVIEW = "پښتو ژبه زموږ د کلتور، ادب او ښکلا ژبه ده";

export default function FontDetailPage() {
  const { slug } = useParams() as { slug: string };
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW);
  const [fontSize, setFontSize] = useState(48);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["font-detail", slug],
    queryFn: () => fetchFontDetail(slug),
    enabled: !!slug,
  });

  const font = data?.data;

  // Inject Font face styling dynamically
  useEffect(() => {
    if (font) {
      document.title = `${font.name} — پښتو فونټونه`;
      const woff2File = font.files.find((f) => f.format === "WOFF2") || font.files[0];
      const fileUrl = woff2File?.fileUrl;

      if (fileUrl) {
        const styleId = `font-face-detail-${font.slug}`;
        if (!document.getElementById(styleId)) {
          const style = document.createElement("style");
          style.id = styleId;
          const formatStr = woff2File?.format ? woff2File.format.toLowerCase() : "woff2";
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
    }
  }, [font]);

  const handleCopyLink = () => {
    const embedUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/css2?family=${encodeURIComponent(font?.name || "")}&display=swap`;
    const embedCode = `<link href="${embedUrl}" rel="stylesheet">`;
    navigator.clipboard.writeText(embedCode);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCss = () => {
    const cssCode = `font-family: "${font?.name || ""}", sans-serif;`;
    navigator.clipboard.writeText(cssCode);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  const handleDownload = () => {
    if (font) {
      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/fonts/${font.slug}/download`);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className={styles.container}>
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--color-text-secondary)" }}>بڼه پورته کیږي...</h3>
          </div>
        </main>
      </>
    );
  }

  if (isError || !font) {
    return (
      <>
        <Header />
        <main className={styles.container}>
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <h3 style={{ fontSize: "1.25rem", color: "var(--color-accent)", marginBottom: "16px" }}>نوموړی فونټ ونه موندل شو!</h3>
            <Link href="/fonts" style={{ color: "var(--color-text-link)", fontWeight: 600 }}>
              ← بیرته فونټونو ته وګرځئ
            </Link>
          </div>
        </main>
      </>
    );
  }

  const embedUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/css2?family=${encodeURIComponent(font.name)}&display=swap`;
  const embedCode = `<link href="${embedUrl}" rel="stylesheet">`;
  const cssCode = `font-family: "${font.name}", sans-serif;`;

  return (
    <>
      <Header />
      <main className={styles.container}>
        {/* Back Link */}
        <Link href="/fonts" className={styles.backLink}>
          ← بیرته ټول فونټونه وګورئ
        </Link>

        {/* Font Info Header Section */}
        <section className={styles.headerSection}>
          <div className={styles.titleArea}>
            <h1 className={styles.fontTitle}>{font.name}</h1>
            <div className={styles.metaInfo}>
              <span>ډیزاینر: {font.designer || "نامعلوم ډيزاینر"}</span>
              <span className={styles.metaDivider}>|</span>
              <span>خپرندوی: {font.publisher || "نامعلوم خپرندوی"}</span>
              <span className={styles.metaDivider}>|</span>
              <span>کټګورۍ: {font.category?.name || "عام"}</span>
            </div>
            <div className={styles.langBadges}>
              {font.supportsPashto && <span className={styles.langBadge}>پښتو (Pashto)</span>}
              {font.supportsUrdu && <span className={styles.langBadge}>اردو (Urdu)</span>}
              {font.supportsArabic && <span className={styles.langBadge}>عربي (Arabic)</span>}
              {font.supportsPersian && <span className={styles.langBadge}>فارسي (Persian)</span>}
            </div>
          </div>

          <div className={styles.downloadArea}>
            <button className={styles.downloadBtn} onClick={handleDownload}>
              فونټ ډاونلوډ کړئ
            </button>
            <span className={styles.licensing}>خلاص سرچینه (مفت ډاونلوډ)</span>
          </div>
        </section>

        {/* Real-time Custom Preview Area */}
        <section className={styles.previewSection}>
          <div className={styles.previewToolbar}>
            <div className={styles.previewInputWrapper}>
              <input
                type="text"
                className={styles.previewInput}
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="دلته خپل پښتو متن ولیکئ..."
              />
            </div>
            <div className={styles.controlGroup}>
              <div className={styles.sliderWrapper}>
                <span className={styles.sliderLabel}>{fontSize}px</span>
                <input
                  type="range"
                  min="16"
                  max="120"
                  className={styles.slider}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                />
              </div>
            </div>
          </div>

          <div
            className={`${styles.previewArea} font-preview`}
            style={{
              fontFamily: `"${font.name}", var(--font-fallback-rtl)`,
              fontSize: `${fontSize}px`,
            }}
          >
            {previewText}
          </div>
        </section>

        {/* Integration Code Embed Cards */}
        <section className={styles.embedSection}>
          <div className={styles.embedCard}>
            <h2 className={styles.embedTitle}>HTML ځای پر ځای کولو کوډ (Embed Link)</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              دا لینک د خپلې ویب پاڼې د HTML په `&lt;head&gt;` برخې کې کاپي کړئ:
            </p>
            <div className={styles.codeBox}>
              <button className={styles.copyBtn} onClick={handleCopyLink}>
                {copiedLink ? "کاپي شو!" : "کاپي کول"}
              </button>
              <code>{embedCode}</code>
            </div>
          </div>

          <div className={styles.embedCard}>
            <h2 className={styles.embedTitle}>CSS کارولو طریقه (CSS Rules)</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              خپلو CSS فایلونو کې دا قاعده د نښه شوي عنصر خط لپاره وکاروئ:
            </p>
            <div className={styles.codeBox}>
              <button className={styles.copyBtn} onClick={handleCopyCss}>
                {copiedCss ? "کاپي شو!" : "کاپي کول"}
              </button>
              <code>{cssCode}</code>
            </div>
          </div>
        </section>
      </main>

      <footer style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--color-bg-secondary)",
        padding: "var(--spacing-lg) 0",
        textAlign: "center",
        fontSize: "0.85rem",
        marginTop: "var(--spacing-3xl)"
      }}>
        <div className="container">
          <p>© 2026 پښتو فونټونه. خطونه د ژوند ژباړونکي دي.</p>
        </div>
      </footer>
    </>
  );
}
