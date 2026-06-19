"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./upload.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminFontUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time font processing status states
  const [processingFontId, setProcessingFontId] = useState<string | null>(null);
  const [processingFontName, setProcessingFontName] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [stepMessage, setStepMessage] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (!stored) {
      router.push("/admin/login");
    }
  }, [router]);

  // Poll progress from Redis via API
  useEffect(() => {
    if (!processingFontId) return;

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
        const res = await fetch(`${API_BASE_URL}/api/admin/fonts/${processingFontId}/progress`, {
          headers,
          credentials: "include",
        });
        const result = await res.json();
        
        if (result.success) {
          const { progress, estimatedRemainingSeconds, step, status: currentStatus } = result.data;
          setProgress(progress);
          setEta(estimatedRemainingSeconds);
          setStepMessage(step);
          setProcessingStatus(currentStatus);

          if (currentStatus === "DRAFT" || currentStatus === "PUBLISHED") {
            setProgress(100);
            setEta(0);
            clearInterval(interval);
          } else if (currentStatus === "ERROR") {
            clearInterval(interval);
            setStatus({
              type: "error",
              message: `تېروتنه: ${step}`,
            });
          }
        }
      } catch (err) {
        console.error("Error polling font progress:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [processingFontId]);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setStatus(null);
    const allowedExtensions = [".ttf", ".otf", ".woff", ".woff2"];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      setStatus({
        type: "error",
        message: "یوازې TTF, OTF, WOFF, او WOFF2 فایلونه اجازه لري.",
      });
      return;
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (selectedFile.size > maxSize) {
      setStatus({
        type: "error",
        message: "د فایل اندازه نشي کولی له 20MB څخه زیاته وي.",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("fontFile", file);

    const storedAdmin = localStorage.getItem("adminUser");
    let token = "";
    if (storedAdmin) {
      try {
        token = JSON.parse(storedAdmin).token;
      } catch (e) {
        console.error("Failed to parse admin user info:", e);
      }
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fonts/upload`, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "د فایل پورته کول ناکام شول.");
      }

      // Transition to processing state
      setProcessingFontId(result.data.id);
      setProcessingFontName(result.data.name);
      setProgress(5);
      setEta(10);
      setStepMessage("د پروسس پیل په حال کې دی...");
      setProcessingStatus("PROCESSING");
      setFile(null);
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "د سرور سره د اړیکې پرمهال ستونزه رامنځته شوه.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProcessingFontId(null);
    setProcessingFontName("");
    setProgress(0);
    setEta(0);
    setStepMessage("");
    setProcessingStatus("");
    setStatus(null);
    setFile(null);
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <Link href="/admin/dashboard" className={styles.backBtn}>
          ← بیرته اداري تختې ته وګرځئ
        </Link>

        <div className={styles.titleArea}>
          <h1 className={styles.title}>نوی فونټ اپلوډ کړئ</h1>
          <p className={styles.desc}>یوازې TTF, OTF, WOFF, یا WOFF2 فایلونه پورته کیدی شي.</p>
        </div>

        {status && !processingFontId && (
          <div className={`${styles.statusMessage} ${styles[status.type]}`}>
            {status.message}
          </div>
        )}

        {/* Dynamic rendering depending on processing state */}
        {processingFontId ? (
          <div>
            {processingStatus === "DRAFT" || processingStatus === "PUBLISHED" ? (
              <div className={styles.successCard}>
                <span className={styles.successIcon}>✓</span>
                <h2 className={styles.successTitle}>پروسس په بریالیتوب سره بشپړ شو!</h2>
                <p className={styles.successDesc}>
                  فونټ "{processingFontName}" په بریالیتوب سره تحلیل شو، د WOFF2 ویب فونټ فارمیټ ورته جوړ شو، او په کټګورۍ کې د ډراف (Draft) په توګه خوندي شو.
                </p>
                <div className={styles.actionRow}>
                  <Link
                    href={`/admin/fonts/${processingFontId}/edit`}
                    className={styles.btn}
                    style={{ flexGrow: 1, textDecoration: "none" }}
                  >
                    تفصیلات سمول (Edit Info)
                  </Link>
                  <button
                    className={`${styles.btn} ${styles.removeBtn}`}
                    style={{
                      flexGrow: 1,
                      backgroundColor: "var(--color-bg-secondary)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-primary)",
                    }}
                    onClick={handleReset}
                  >
                    بل فونټ پورته کړئ
                  </button>
                </div>
              </div>
            ) : processingStatus === "ERROR" ? (
              <div className={styles.successCard} style={{ borderColor: "#fee2e2", backgroundColor: "#fef2f2" }}>
                <span className={styles.successIcon} style={{ color: "#dc2626" }}>✗</span>
                <h2 className={styles.successTitle} style={{ color: "#991b1b" }}>د فونټ پروسس کول ناکام شول!</h2>
                <p className={styles.successDesc} style={{ color: "#b91c1c" }}>
                  {stepMessage || "د فایل تحلیل کې ستونزه وه. مهرباني وکړئ ډاډ ترلاسه کړئ چې فونټ خراب نه دی او پښتو/عربي کیپ ملاتړ لري."}
                </p>
                <button
                  className={styles.btn}
                  onClick={handleReset}
                  style={{ width: "100%" }}
                >
                  بیا هڅه وکړئ (Try Again)
                </button>
              </div>
            ) : (
              <div className={styles.progressContainer}>
                <div className={styles.progressInfo}>
                  <span className={styles.progressLabel}>د "{processingFontName}" فونټ تحلیل او پروسس...</span>
                  <span className={styles.progressPercentage}>{progress}%</span>
                </div>
                <div className={styles.progressBarWrapper}>
                  <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                </div>
                <div className={styles.progressMeta}>
                  <span className={styles.progressStep}>{stepMessage}</span>
                  <span className={styles.progressEta}>
                    {eta > 0 ? `باقي پاتې وخت: ~${eta} ثانیې` : "د بشپړیدو په حال کې..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {!file ? (
              <div
                className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ""}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className={styles.dropzoneIcon}>📥</span>
                <p style={{ fontWeight: 600 }}>فایل دلته راکاږئ یا د غوره کولو لپاره کلیک وکړئ</p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  مکسیمم اندازه: 20MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".ttf,.otf,.woff,.woff2"
                  className={styles.fileInput}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className={styles.fileInfo}>
                <div>
                  <p className={styles.fileName}>{file.name}</p>
                  <p className={styles.fileSize}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button className={styles.removeBtn} onClick={() => setFile(null)} disabled={loading}>
                  لرې کول
                </button>
              </div>
            )}

            <button
              className={styles.btn}
              onClick={handleUpload}
              disabled={!file || loading}
              style={{ width: "100%", marginTop: "var(--spacing-md)" }}
            >
              {loading ? "پورته کیږي..." : "فونټ اپلوډ او پروسس کړئ"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
