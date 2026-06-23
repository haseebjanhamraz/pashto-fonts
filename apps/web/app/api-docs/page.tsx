"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useLanguage } from "@/lib/i18n/useLanguage";
import styles from "./page.module.css";

export default function ApiDocsPage() {
  const { t, language } = useLanguage();
  const [apiUrl, setApiUrl] = useState("http://localhost:4000");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Try to determine API URL dynamically, defaulting to standard patterns
      const host = window.location.hostname;
      if (host.includes("kpcybers.com")) {
        setApiUrl("https://pashtofonts.kpcybers.com");
      } else if (host.includes("pashtofonts.com")) {
        setApiUrl("https://pashtofonts.com");
      } else {
        setApiUrl(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");
      }
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const htmlEmbedExample = `<link href="${apiUrl}/css2?family=Bahij+Titr&display=swap" rel="stylesheet">`;
  const cssEmbedExample = `@import url('${apiUrl}/css2?family=Bahij+Titr&display=swap');

body {
  font-family: 'Bahij Titr', sans-serif;
}`;

  const jsFetchExample = `fetch('${apiUrl}/api/fonts?limit=5')
  .then(res => res.json())
  .then(data => console.log(data));`;

  const curlExample = `curl -X GET "${apiUrl}/api/fonts?category=naskh&sort=popular"`;

  const isRtl = language === "ps";

  return (
    <>
      <Header />

      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Documentation</h3>
          <nav className={styles.sidebarNav}>
            <a href="#overview" className={styles.sidebarLink}>Overview</a>
            <a href="#embed-api" className={styles.sidebarLink}>Web Font Embed API</a>
            <a href="#fonts-api" className={styles.sidebarLink}>Fonts API Endpoint</a>
            <a href="#font-detail-api" className={styles.sidebarLink}>Font Detail Endpoint</a>
            <a href="#categories-api" className={styles.sidebarLink}>Categories API</a>
          </nav>
        </aside>

        <main className={styles.content}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>{t("common.developerApi")}</h1>
            <p className={styles.subtitle}>
              Integrate beautiful, open-source RTL web fonts dynamically into your web applications and designs.
            </p>
          </div>

          {/* Section: Overview */}
          <section id="overview" className={styles.section}>
            <h2 className={styles.sectionTitle}>Overview</h2>
            <p className={styles.text}>
              Pashto Fonts provides developer-friendly integration pipelines. You can dynamically load stylesheets to render typography on the fly using our CDN-compatible font server, or consume the REST API to build customized font discovery panels, installers, or plugins.
            </p>
          </section>

          {/* Section: Embed API */}
          <section id="embed-api" className={styles.section}>
            <h2 className={styles.sectionTitle}>Web Font Embed API (/css2)</h2>
            <p className={styles.text}>
              Request and download font packs directly in your stylesheets. Our CSS service automatically serves optimized <code>.woff2</code> assets with proper unicode range subsets.
            </p>

            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "1.5rem 0 0.5rem" }}>HTML Link Embed</h3>
            <p className={styles.text}>Add this link element in the HTML <code>&lt;head&gt;</code> section:</p>

            <div className={styles.codeSnippetContainer}>
              <div className={styles.codeHeader}>
                <span className={styles.codeLang}>HTML</span>
                <button 
                  onClick={() => handleCopy(htmlEmbedExample, "html")} 
                  className={styles.copyBtn}
                >
                  {copiedText === "html" ? t("fontDetail.copied") : t("fontDetail.copy")}
                </button>
              </div>
              <div className={styles.codeBlock}>{htmlEmbedExample}</div>
            </div>

            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "1.5rem 0 0.5rem" }}>CSS @import Embed</h3>
            <p className={styles.text}>Alternatively, load the font dynamically inside custom stylesheets:</p>

            <div className={styles.codeSnippetContainer}>
              <div className={styles.codeHeader}>
                <span className={styles.codeLang}>CSS</span>
                <button 
                  onClick={() => handleCopy(cssEmbedExample, "css")} 
                  className={styles.copyBtn}
                >
                  {copiedText === "css" ? t("fontDetail.copied") : t("fontDetail.copy")}
                </button>
              </div>
              <div className={styles.codeBlock}>{cssEmbedExample}</div>
            </div>
          </section>

          {/* Section: Get Fonts */}
          <section id="fonts-api" className={styles.section}>
            <h2 className={styles.sectionTitle}>List Fonts API</h2>
            <div className={styles.endpointHeader}>
              <span className={`${styles.methodBadge} ${styles.methodGet}`}>GET</span>
              <span className={styles.endpointPath}>/api/fonts</span>
            </div>
            <p className={styles.text}>
              Retrieve a paginated list of all active open-source fonts in the catalog. Supports search queries, category filters, language filters, and sorting.
            </p>

            <h4 style={{ fontWeight: 750, margin: "1rem 0 0.5rem" }}>Query Parameters</h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.paramName}>page</td>
                    <td className={styles.paramType}>number</td>
                    <td><span className={styles.optionalTag}>Optional</span></td>
                    <td>Page index for paginated results. Default: <code>1</code>.</td>
                  </tr>
                  <tr>
                    <td className={styles.paramName}>limit</td>
                    <td className={styles.paramType}>number</td>
                    <td><span className={styles.optionalTag}>Optional</span></td>
                    <td>Number of items per page. Default: <code>10</code>.</td>
                  </tr>
                  <tr>
                    <td className={styles.paramName}>search</td>
                    <td className={styles.paramType}>string</td>
                    <td><span className={styles.optionalTag}>Optional</span></td>
                    <td>Search criteria matched against font names, design credits, or tags.</td>
                  </tr>
                  <tr>
                    <td className={styles.paramName}>category</td>
                    <td className={styles.paramType}>string</td>
                    <td><span className={styles.optionalTag}>Optional</span></td>
                    <td>Category slug to filter by (e.g. <code>naskh</code>, <code>nastaliq</code>).</td>
                  </tr>
                  <tr>
                    <td className={styles.paramName}>language</td>
                    <td className={styles.paramType}>string</td>
                    <td><span className={styles.optionalTag}>Optional</span></td>
                    <td>Language code check (options: <code>pashto</code>, <code>urdu</code>, <code>arabic</code>, <code>persian</code>).</td>
                  </tr>
                  <tr>
                    <td className={styles.paramName}>sort</td>
                    <td className={styles.paramType}>string</td>
                    <td><span className={styles.optionalTag}>Optional</span></td>
                    <td>Sort ordering. Options: <code>popular</code> (most viewed), <code>downloads</code>, <code>latest</code>, <code>name</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 style={{ fontWeight: 750, margin: "1rem 0 0.5rem" }}>Example Request (JavaScript)</h4>
            <div className={styles.codeSnippetContainer}>
              <div className={styles.codeHeader}>
                <span className={styles.codeLang}>JavaScript</span>
                <button 
                  onClick={() => handleCopy(jsFetchExample, "js")} 
                  className={styles.copyBtn}
                >
                  {copiedText === "js" ? t("fontDetail.copied") : t("fontDetail.copy")}
                </button>
              </div>
              <div className={styles.codeBlock}>{jsFetchExample}</div>
            </div>
          </section>

          {/* Section: Font Detail */}
          <section id="font-detail-api" className={styles.section}>
            <h2 className={styles.sectionTitle}>Get Font Detail</h2>
            <div className={styles.endpointHeader}>
              <span className={`${styles.methodBadge} ${styles.methodGet}`}>GET</span>
              <span className={styles.endpointPath}>/api/fonts/:slug</span>
            </div>
            <p className={styles.text}>
              Fetch deep metadata, download statistics, design references, license terms, and dynamic file assets for a single font.
            </p>

            <h4 style={{ fontWeight: 750, margin: "1rem 0 0.5rem" }}>URL Parameters</h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={styles.paramName}>slug</td>
                    <td className={styles.paramType}>string</td>
                    <td><span className={styles.requiredTag}>Required</span></td>
                    <td>The unique URL slug of the font (e.g. <code>bahij-titr</code>).</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 style={{ fontWeight: 750, margin: "1rem 0 0.5rem" }}>Example Request (cURL)</h4>
            <div className={styles.codeSnippetContainer}>
              <div className={styles.codeHeader}>
                <span className={styles.codeLang}>Shell</span>
                <button 
                  onClick={() => handleCopy(curlExample, "curl")} 
                  className={styles.copyBtn}
                >
                  {copiedText === "curl" ? t("fontDetail.copied") : t("fontDetail.copy")}
                </button>
              </div>
              <div className={styles.codeBlock}>{curlExample}</div>
            </div>
          </section>

          {/* Section: Categories */}
          <section id="categories-api" className={styles.section}>
            <h2 className={styles.sectionTitle}>List Categories</h2>
            <div className={styles.endpointHeader}>
              <span className={`${styles.methodBadge} ${styles.methodGet}`}>GET</span>
              <span className={styles.endpointPath}>/api/categories</span>
            </div>
            <p className={styles.text}>
              Get all available typography categories supported by the platform, including their unique slugs and descriptions.
            </p>
          </section>
        </main>
      </div>

      <footer style={{
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
