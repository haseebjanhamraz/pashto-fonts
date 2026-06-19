"use client";

import Header from "@/components/Header";
import PreviewControls from "@/components/PreviewControls";
import FontCatalog from "@/components/FontCatalog";

export default function FontsPage() {
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
          <p>© 2026 پښتو فونټونه. خطونه د کلتور او هنر ښکلا ده.</p>
        </div>
      </footer>
    </>
  );
}
