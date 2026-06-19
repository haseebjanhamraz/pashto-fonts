"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./fonts.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface FontFile {
  id: string;
  weight: number;
  format: string;
}

interface Font {
  id: string;
  name: string;
  slug: string;
  designer: string | null;
  status: "DRAFT" | "PROCESSING" | "PUBLISHED" | "PRIVATE" | "ARCHIVED" | "ERROR";
  isFeatured: boolean;
  downloadCount: number;
  viewCount: number;
  files: FontFile[];
}

interface FontStatusCellProps {
  fontId: string;
  initialStatus: string;
  onComplete: () => void;
}

function FontStatusCell({ fontId, initialStatus, onComplete }: FontStatusCellProps) {
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(5);
  const [step, setStep] = useState("د پروسس پیل په حال کې دی...");

  useEffect(() => {
    if (initialStatus !== "PROCESSING") {
      setStatus(initialStatus);
      return;
    }

    const storedAdmin = localStorage.getItem("adminUser");
    let token = "";
    if (storedAdmin) {
      try {
        token = JSON.parse(storedAdmin).token;
      } catch (e) {
        console.error("Failed to parse token:", e);
      }
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/fonts/${fontId}/progress`, {
          headers,
          credentials: "include",
        });
        const result = await res.json();
        
        if (result.success) {
          const { progress: currentProgress, step: currentStep, status: currentStatus } = result.data;
          setProgress(currentProgress);
          setStep(currentStep);
          setStatus(currentStatus);

          if (currentStatus !== "PROCESSING") {
            clearInterval(interval);
            onComplete(); // Trigger parent reload to update weights and files list
          }
        }
      } catch (err) {
        console.error("Error polling font progress in list:", err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [fontId, initialStatus, onComplete]);

  if (status === "PROCESSING") {
    return (
      <div className={styles.miniProgressContainer}>
        <div className={styles.miniProgressBarWrapper}>
          <div className={styles.miniProgressBar} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.miniProgressMeta}>
          <span className={styles.miniProgressStep} title={step}>{step}</span>
          <span>%{progress}</span>
        </div>
      </div>
    );
  }

  return (
    <span className={`${styles.statusBadge} ${styles["status" + status]}`}>
      {status}
    </span>
  );
}

export default function AdminFontsListPage() {
  const router = useRouter();
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminFonts = useCallback(async () => {
    setError(null);

    const storedAdmin = localStorage.getItem("adminUser");
    let token = "";
    if (storedAdmin) {
      try {
        token = JSON.parse(storedAdmin).token;
      } catch (e) {
        console.error("Failed to parse token:", e);
      }
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fonts`, {
        headers,
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "د فونټونو پورته کول ناکام شول.");
      }

      setFonts(result.data);
    } catch (err: any) {
      setError(err.message || "د اړیکې پرمهال ستونزه رامنځته شوه.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (!stored) {
      router.push("/admin/login");
    } else {
      fetchAdminFonts();
    }
  }, [router, fetchAdminFonts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ایا ډاډه یاست چې فونټ "${name}" غواړئ حذف کړئ؟`)) return;

    const storedAdmin = localStorage.getItem("adminUser");
    let token = "";
    if (storedAdmin) {
      token = JSON.parse(storedAdmin).token;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fonts/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "د فونټ حذف کول ناکام شول.");
      }

      // Update state
      setFonts((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      alert(err.message || "تېروتنه رامنځته شوه.");
    }
  };

  if (loading && fonts.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h3>فونټونه پورته کیږي...</h3>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Area */}
      <div className={styles.headerRow}>
        <div>
          <Link href="/admin/dashboard" style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            ← بیرته کنټرول تختې ته
          </Link>
          <h1 className={styles.title}>د فونټونو اداره کول</h1>
        </div>
        <Link href="/admin/fonts/upload" className={styles.uploadBtn}>
          📥 نوی فونټ اضافه کړئ (Upload)
        </Link>
      </div>

      {error && <div style={{ color: "#dc2626", fontWeight: "bold" }}>{error}</div>}

      {/* Font Listing Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>فونټ نوم</th>
              <th className={styles.th}>ډیزاینر</th>
              <th className={styles.th}>سټایلونه / ډکوالی</th>
              <th className={styles.th}>ډاونلوډونه</th>
              <th className={styles.th}>کتنې</th>
              <th className={styles.th}>حالت</th>
              <th className={styles.th}>کړنې</th>
            </tr>
          </thead>
          <tbody>
            {fonts.map((font) => (
              <tr key={font.id}>
                <td className={`${styles.td} ${styles.fontName}`}>{font.name}</td>
                <td className={styles.td}>{font.designer || "Unknown"}</td>
                <td className={styles.td}>
                  {font.files.filter((f) => f.format === "WOFF2").map((f) => f.weight).join(", ") || (font.status === "PROCESSING" ? "پروسس لاندې..." : "Regular")}
                </td>
                <td className={styles.td}>{font.downloadCount}</td>
                <td className={styles.td}>{font.viewCount}</td>
                <td className={styles.td}>
                  <FontStatusCell
                    fontId={font.id}
                    initialStatus={font.status}
                    onComplete={fetchAdminFonts}
                  />
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <Link href={`/admin/fonts/${font.id}/edit`} className={styles.actionBtn}>
                      سمول (Edit)
                    </Link>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => handleDelete(font.id, font.name)}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {fonts.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  تر اوسه کوم فونټ نشته.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
