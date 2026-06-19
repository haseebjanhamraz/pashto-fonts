"use client";

import Header from "@/components/Header";
import PreviewControls from "@/components/PreviewControls";
import FontCatalog from "@/components/FontCatalog";
import { useLanguage } from "@/lib/i18n/useLanguage";

export default function FontsPage() {
  const { language } = useLanguage();
  return (
    <>
      <Header />
      <PreviewControls />
      <main style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <FontCatalog />
      </main>
      <footer style={{
        backgroundColor: "var(--color-primary)",
        color: "var(--color-bg-secondary)",
        padding: "var(--spacing-lg) 0",
        textAlign: "center",
        fontSize: "0.85rem"
      }}>
        <div className="container">
          <p>
            {language === "ps" 
              ? "© 2026 پښتو فونټونه. خطونه د کلتور او هنر ښکلا ده." 
              : "© 2026 Pashto Fonts. Typography is the elegance of culture and art."}
          </p>
        </div>
      </footer>
    </>
  );
}
