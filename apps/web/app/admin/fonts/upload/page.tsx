"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./upload.module.css";
import { useLanguage } from "@/lib/i18n/useLanguage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type FileStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "done"
  | "error"
  | "duplicate";

interface UploadEntry {
  id: string; // local UUID for react key
  file: File;
  status: FileStatus;
  fontId?: string;
  fontName?: string;
  fontSlug?: string;
  progress: number;
  eta: number;
  stepMessage: string;
  errorMessage?: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AdminFontUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { language, t } = useLanguage();

  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [batchDone, setBatchDone] = useState(false);

  // Track which fontIds are currently being polled
  const pollingIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (!stored) router.push("/admin/login");
    // Cleanup intervals on unmount
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval);
    };
  }, [router]);

  const getAuthToken = () => {
    try {
      const stored = localStorage.getItem("adminUser");
      if (stored) return JSON.parse(stored).token as string;
    } catch {}
    return "";
  };

  // Update a single entry by its local id
  const updateEntry = useCallback((id: string, patch: Partial<UploadEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  // Start polling for a specific font's progress
  const startPolling = useCallback(
    (localId: string, fontId: string) => {
      // Avoid duplicate intervals
      if (pollingIntervals.current[fontId]) return;

      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/admin/fonts/${fontId}/progress`, {
            headers,
            credentials: "include",
          });
          const result = await res.json();

          if (result.success) {
            const { progress, estimatedRemainingSeconds, step, status } = result.data;

            if (status === "DRAFT" || status === "PUBLISHED") {
              updateEntry(localId, {
                progress: 100,
                eta: 0,
                stepMessage: step,
                status: "done",
              });
              clearInterval(pollingIntervals.current[fontId]);
              delete pollingIntervals.current[fontId];
            } else if (status === "ERROR") {
              updateEntry(localId, {
                status: "error",
                stepMessage: step,
                errorMessage: step,
              });
              clearInterval(pollingIntervals.current[fontId]);
              delete pollingIntervals.current[fontId];
            } else {
              updateEntry(localId, {
                progress,
                eta: estimatedRemainingSeconds,
                stepMessage: step,
                status: "processing",
              });
            }
          }
        } catch (err) {
          console.error("Error polling font progress:", err);
        }
      }, 1200);

      pollingIntervals.current[fontId] = interval;
    },
    [updateEntry]
  );

  const validateFiles = (files: FileList | File[]): File[] => {
    const allowed = [".ttf", ".otf", ".woff", ".woff2"];
    const maxSize = 20 * 1024 * 1024;
    return Array.from(files).filter((f) => {
      const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
      return allowed.includes(ext) && f.size <= maxSize;
    });
  };

  const addFiles = (incoming: FileList | File[]) => {
    const valid = validateFiles(incoming);
    const newEntries: UploadEntry[] = valid.map((file) => ({
      id: generateId(),
      file,
      status: "queued",
      progress: 0,
      eta: 0,
      stepMessage: "",
    }));
    setEntries((prev) => {
      // Deduplicate by name + size
      const existingKeys = new Set(prev.map((e) => `${e.file.name}-${e.file.size}`));
      const deduped = newEntries.filter(
        (ne) => !existingKeys.has(`${ne.file.name}-${ne.file.size}`)
      );
      return [...prev, ...deduped];
    });
    setBatchDone(false);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else setIsDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = ""; // reset so same files can be re-picked
    }
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const clearAll = () => {
    setEntries([]);
    setBatchDone(false);
  };

  const handleUpload = async () => {
    const queued = entries.filter((e) => e.status === "queued");
    if (queued.length === 0) return;

    setIsUploading(true);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Mark all queued as uploading
    setEntries((prev) =>
      prev.map((e) => (e.status === "queued" ? { ...e, status: "uploading" } : e))
    );

    const formData = new FormData();
    queued.forEach((e) => formData.append("fontFiles", e.file));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fonts/upload`, {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok && !result.data) {
        // Entire batch failed (multer error, etc.)
        setEntries((prev) =>
          prev.map((e) =>
            e.status === "uploading"
              ? { ...e, status: "error", errorMessage: result.error?.message || "Upload failed" }
              : e
          )
        );
        return;
      }

      // result.data is an array of per-file results
      const apiResults: Array<{
        originalName: string;
        success: boolean;
        data?: { id: string; name: string; slug: string; status: string; jobId: string };
        error?: { code: string; message: string };
      }> = result.data || [];

      // Match API results back to local entries by originalName
      setEntries((prev) => {
        const updated = [...prev];

        apiResults.forEach((apiResult) => {
          // Find the uploading entry with matching filename
          const idx = updated.findIndex(
            (e) => e.status === "uploading" && e.file.name === apiResult.originalName
          );
          if (idx === -1) return;

          if (apiResult.success && apiResult.data) {
            updated[idx] = {
              ...updated[idx],
              status: "processing",
              fontId: apiResult.data.id,
              fontName: apiResult.data.name,
              fontSlug: apiResult.data.slug,
              progress: 5,
              eta: 10,
              stepMessage: t("adminUpload.processingTitle"),
            };
          } else {
            const isDuplicate = apiResult.error?.code === "DUPLICATE_FONT_FILE";
            updated[idx] = {
              ...updated[idx],
              status: isDuplicate ? "duplicate" : "error",
              errorMessage: apiResult.error?.message || "Failed",
            };
          }
        });

        return updated;
      });

      // Start polling for successfully submitted fonts
      // Wait for state to flush, then start polling from the entries we know
      apiResults.forEach((apiResult) => {
        if (apiResult.success && apiResult.data) {
          const localEntry = queued.find((e) => e.file.name === apiResult.originalName);
          if (localEntry) {
            startPolling(localEntry.id, apiResult.data.id);
          }
        }
      });
    } catch (err: any) {
      setEntries((prev) =>
        prev.map((e) =>
          e.status === "uploading"
            ? { ...e, status: "error", errorMessage: err.message || "Network error" }
            : e
        )
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Check if batch is complete (all non-queued and no uploading/processing)
  useEffect(() => {
    if (entries.length === 0) return;
    const allSettled = entries.every((e) =>
      ["done", "error", "duplicate"].includes(e.status)
    );
    if (allSettled) setBatchDone(true);
  }, [entries]);

  const queuedCount = entries.filter((e) => e.status === "queued").length;
  const successCount = entries.filter((e) => e.status === "done").length;
  const failedCount = entries.filter((e) =>
    ["error", "duplicate"].includes(e.status)
  ).length;
  const processingCount = entries.filter((e) =>
    ["uploading", "processing"].includes(e.status)
  ).length;

  const getStatusBadgeClass = (status: FileStatus) => {
    switch (status) {
      case "queued": return styles.badgeQueued;
      case "uploading": return styles.badgeUploading;
      case "processing": return styles.badgeProcessing;
      case "done": return styles.badgeDone;
      case "error": return styles.badgeError;
      case "duplicate": return styles.badgeDuplicate;
    }
  };

  const getStatusLabel = (status: FileStatus) => {
    switch (status) {
      case "queued": return t("adminUpload.statusQueued");
      case "uploading": return t("adminUpload.statusUploading");
      case "processing": return t("adminUpload.statusProcessing");
      case "done": return t("adminUpload.statusDone");
      case "error": return t("adminUpload.statusError");
      case "duplicate": return t("adminUpload.statusDuplicate");
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <Link href="/admin/dashboard" className={styles.backBtn}>
          ← {t("adminDashboard.title")}
        </Link>

        <div className={styles.titleArea}>
          <h1 className={styles.title}>{t("adminUpload.title")}</h1>
          <p className={styles.desc}>{t("adminUpload.desc")}</p>
        </div>

        {/* Dropzone — always visible unless batch is fully done */}
        {!batchDone && (
          <div
            className={`${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.dropzoneIcon}>📥</span>
            <p style={{ fontWeight: 600 }}>{t("adminUpload.dropzoneText")}</p>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
              {t("adminUpload.maxSize")}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              multiple
              className={styles.fileInput}
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* File list */}
        {entries.length > 0 && (
          <div className={styles.fileList}>
            {/* List header */}
            <div className={styles.fileListHeader}>
              <span>
                {entries.length} {t("adminUpload.filesSelected")}
              </span>
              {!isUploading && (
                <button className={styles.clearAllBtn} onClick={clearAll}>
                  {t("adminUpload.clearAll")}
                </button>
              )}
            </div>

            {/* Per-file rows */}
            {entries.map((entry) => (
              <div key={entry.id} className={styles.fileRow}>
                <div className={styles.fileRowTop}>
                  <div className={styles.fileRowInfo}>
                    <span className={styles.fileName}>{entry.file.name}</span>
                    <span className={styles.fileSize}>
                      {(entry.file.size / (1024 * 1024)).toFixed(1)}{" "}
                      {t("adminUpload.fileSizeMB")}
                    </span>
                  </div>
                  <div className={styles.fileRowRight}>
                    <span className={`${styles.badge} ${getStatusBadgeClass(entry.status)}`}>
                      {getStatusLabel(entry.status)}
                    </span>
                    {entry.status === "queued" && !isUploading && (
                      <button
                        className={styles.removeRowBtn}
                        onClick={() => removeEntry(entry.id)}
                        title={t("adminUpload.removeBtn")}
                      >
                        ✕
                      </button>
                    )}
                    {entry.status === "done" && entry.fontId && (
                      <Link
                        href={`/admin/fonts/${entry.fontId}/edit`}
                        className={styles.editRowBtn}
                      >
                        {t("adminUpload.btnEditDetails")}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Progress bar for processing items */}
                {(entry.status === "uploading" || entry.status === "processing") && (
                  <div className={styles.rowProgress}>
                    <div className={styles.progressBarWrapper}>
                      <div
                        className={styles.progressBar}
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                    <div className={styles.progressMeta}>
                      <span className={styles.progressStep}>{entry.stepMessage}</span>
                      <span className={styles.progressEta}>
                        {entry.progress}% ·{" "}
                        {entry.eta > 0
                          ? `~${entry.eta}s ${t("adminUpload.etaRemaining")}`
                          : t("adminUpload.etaCompleting")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {(entry.status === "error" || entry.status === "duplicate") &&
                  entry.errorMessage && (
                    <p className={styles.rowError}>{entry.errorMessage}</p>
                  )}

                {/* Done — font name */}
                {entry.status === "done" && entry.fontName && (
                  <p className={styles.rowDoneMsg}>
                    ✓ {entry.fontName} — {t("adminUpload.processingSuccessDesc")}
                  </p>
                )}
              </div>
            ))}

            {/* Batch summary */}
            {batchDone && (
              <div className={styles.batchSummary}>
                <span className={styles.batchTitle}>{t("adminUpload.batchSummary")}:</span>
                {successCount > 0 && (
                  <span className={styles.batchGood}>
                    {successCount} {t("adminUpload.batchSucceeded")}
                  </span>
                )}
                {failedCount > 0 && (
                  <span className={styles.batchBad}>
                    {failedCount} {t("adminUpload.batchFailed")}
                  </span>
                )}
                <button className={styles.btn} onClick={clearAll}>
                  {t("adminUpload.btnUploadAnother")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload button */}
        {!batchDone && entries.length > 0 && (
          <div className={styles.uploadActions}>
            <button
              className={styles.btn}
              onClick={handleUpload}
              disabled={queuedCount === 0 || isUploading || processingCount > 0}
              style={{ flexGrow: 1 }}
            >
              {isUploading
                ? t("adminUpload.btnUploading")
                : `${t("adminUpload.btnUpload")} (${queuedCount})`}
            </button>
            {processingCount > 0 && (
              <span className={styles.processingNote}>
                {processingCount} {t("adminUpload.statusProcessing")}
              </span>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
