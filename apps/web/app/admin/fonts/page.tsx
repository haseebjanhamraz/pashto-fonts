"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./fonts.module.css";
import { useLanguage } from "@/lib/i18n/useLanguage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const ALL_STATUSES = ["DRAFT", "PROCESSING", "PUBLISHED", "PRIVATE", "ARCHIVED", "ERROR"] as const;
type FontStatus = (typeof ALL_STATUSES)[number];

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
  status: FontStatus;
  isFeatured: boolean;
  downloadCount: number;
  viewCount: number;
  files: FontFile[];
}

/* ─── Mini inline processing progress cell ─────────────────── */
interface FontStatusCellProps {
  font: Font;
  onStatusChange: (id: string, status: FontStatus) => void;
  onComplete: () => void;
}

function FontStatusCell({ font, onStatusChange, onComplete }: FontStatusCellProps) {
  const [liveStatus, setLiveStatus] = useState<FontStatus>(font.status);
  const [progress, setProgress] = useState(5);
  const [step, setStep] = useState<string | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync from parent when font reloads
  useEffect(() => {
    setLiveStatus(font.status);
  }, [font.status]);

  // Poll if processing
  useEffect(() => {
    if (liveStatus !== "PROCESSING") return;

    const storedAdmin = localStorage.getItem("adminUser");
    let token = "";
    try { token = JSON.parse(storedAdmin || "{}").token || ""; } catch {}

    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/fonts/${font.id}/progress`, {
          headers, credentials: "include",
        });
        const result = await res.json();
        if (result.success) {
          const { progress: p, step: s, status: st } = result.data;
          setProgress(p);
          setStep(s);
          setLiveStatus(st);
          if (st !== "PROCESSING") { clearInterval(interval); onComplete(); }
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [font.id, liveStatus, onComplete]);

  const handleStatusChange = async (newStatus: FontStatus) => {
    setDropOpen(false);
    if (newStatus === liveStatus || saving) return;
    setSaving(true);
    const prev = liveStatus;
    setLiveStatus(newStatus); // optimistic

    try {
      const storedAdmin = localStorage.getItem("adminUser");
      let token = "";
      try { token = JSON.parse(storedAdmin || "{}").token || ""; } catch {}

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Fetch current font data first then patch
      const getRes = await fetch(`${API_BASE_URL}/api/admin/fonts/${font.id}`, {
        headers, credentials: "include",
      });
      const fontData = await getRes.json();
      if (!getRes.ok) throw new Error("Failed to fetch font");

      const patchRes = await fetch(`${API_BASE_URL}/api/admin/fonts/${font.id}`, {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ ...fontData.data, status: newStatus }),
      });
      if (!patchRes.ok) throw new Error("Failed to save");
      onStatusChange(font.id, newStatus);
    } catch {
      setLiveStatus(prev); // revert
    } finally {
      setSaving(false);
    }
  };

  if (liveStatus === "PROCESSING") {
    const displayStep = step || t("adminUpload.processingTitle");
    return (
      <div className={styles.miniProgressContainer}>
        <div className={styles.miniProgressBarWrapper}>
          <div className={styles.miniProgressBar} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.miniProgressMeta}>
          <span className={styles.miniProgressStep} title={displayStep}>{displayStep}</span>
          <span>{progress}%</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={dropRef} className={styles.statusDropWrapper}>
      <button
        className={`${styles.statusBadge} ${styles["status" + liveStatus]} ${saving ? styles.statusSaving : ""}`}
        onClick={() => setDropOpen((o) => !o)}
        title={t("adminFonts.quickStatusLabel")}
        disabled={saving}
      >
        {liveStatus}
        {!saving && <span className={styles.statusCaret}>▾</span>}
      </button>
      {dropOpen && (
        <div className={styles.statusDropMenu}>
          {ALL_STATUSES.filter((s) => s !== "PROCESSING").map((s) => (
            <button
              key={s}
              className={`${styles.statusDropItem} ${s === liveStatus ? styles.statusDropActive : ""}`}
              onClick={() => handleStatusChange(s)}
            >
              <span className={`${styles.statusDot} ${styles["dot" + s]}`} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AdminFontsListPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Bulk action state
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkStatusDrop, setBulkStatusDrop] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const bulkStatusRef = useRef<HTMLDivElement>(null);

  // Close bulk status dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bulkStatusRef.current && !bulkStatusRef.current.contains(e.target as Node)) {
        setBulkStatusDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    try {
      const token = JSON.parse(localStorage.getItem("adminUser") || "{}").token || "";
      return token
        ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
        : { "Content-Type": "application/json" };
    } catch { return { "Content-Type": "application/json" }; }
  }, []);

  const fetchAdminFonts = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`${API_BASE_URL}/api/admin/fonts?${params}`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.status === 401) {
        localStorage.removeItem("adminUser");
        router.push("/admin/login");
        return;
      }
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error?.message || t("common.error"));
      setFonts(result.data);
    } catch (err: any) {
      setError(err.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, t, search, statusFilter]);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (!stored) { router.push("/admin/login"); return; }
    fetchAdminFonts();
  }, [router, fetchAdminFonts]);

  // ─── Selection helpers ───────────────────────────────────────
  const allIds = fonts.map((f) => f.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Individual delete ───────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("adminFonts.deleteConfirm").replace("{name}", name))) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fonts/${id}`, {
        method: "DELETE", headers: getAuthHeaders(), credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error?.message || t("adminFonts.deleteError"));
      setFonts((prev) => prev.filter((f) => f.id !== id));
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err: any) {
      alert(err.message || t("adminFonts.deleteError"));
    }
  };

  // ─── Bulk operations ─────────────────────────────────────────
  const callBulk = async (
    action: "set-status" | "set-featured" | "delete",
    payload?: { status?: FontStatus; isFeatured?: boolean }
  ) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;

    setBulkApplying(true);
    setBulkMsg(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fonts/bulk`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ ids, action, payload }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error?.message || t("adminFonts.bulkError"));

      const count = result.data?.updated ?? ids.length;
      setBulkMsg({
        type: "success",
        text: t("adminFonts.bulkSuccess").replace("{count}", String(count)),
      });
      setSelected(new Set());
      await fetchAdminFonts();
    } catch (err: any) {
      setBulkMsg({ type: "error", text: err.message || t("adminFonts.bulkError") });
    } finally {
      setBulkApplying(false);
    }
  };

  const handleBulkStatus = (status: FontStatus) => {
    setBulkStatusDrop(false);
    callBulk("set-status", { status });
  };

  const handleBulkFeatured = (isFeatured: boolean) => callBulk("set-featured", { isFeatured });

  const handleBulkDelete = () => {
    const msg = t("adminFonts.deleteBulkConfirm").replace("{count}", String(selected.size));
    if (!confirm(msg)) return;
    callBulk("delete");
  };

  const handleStatusChange = (id: string, newStatus: FontStatus) => {
    setFonts((prev) => prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
  };

  if (loading && fonts.length === 0) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingSpinner} />
        <p>{t("adminFonts.loadingText")}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ── Header ── */}
      <div className={styles.headerRow}>
        <div>
          <Link href="/admin/dashboard" className={styles.backLink}>
            ← {t("adminDashboard.title")}
          </Link>
          <h1 className={styles.title}>{t("adminFonts.title")}</h1>
        </div>
        <Link href="/admin/fonts/upload" className={styles.uploadBtn}>
          {t("adminFonts.btnUpload")}
        </Link>
      </div>

      {/* ── Toolbar: search + status filter ── */}
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder={t("adminFonts.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.statusSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">{t("adminFonts.filterAll")}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* ── Bulk feedback banner ── */}
      {bulkMsg && (
        <div className={`${styles.bulkBanner} ${styles["bulk" + bulkMsg.type]}`}>
          {bulkMsg.text}
          <button className={styles.bulkBannerClose} onClick={() => setBulkMsg(null)}>✕</button>
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Table ── */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.thCheck}`}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={allSelected}
                    onChange={toggleAll}
                    title="Select all"
                  />
                  <span className={styles.checkmark} />
                </label>
              </th>
              <th className={styles.th}>{t("adminFonts.colName")}</th>
              <th className={styles.th}>{t("adminFonts.colDesigner")}</th>
              <th className={styles.th}>{t("adminFonts.colStyles")}</th>
              <th className={styles.th}>{t("adminFonts.colDownloads")}</th>
              <th className={styles.th}>{t("adminFonts.colViews")}</th>
              <th className={styles.th}>{t("adminFonts.colStatus")}</th>
              <th className={styles.th}>{t("adminFonts.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {fonts.map((font) => {
              const isSelected = selected.has(font.id);
              return (
                <tr key={font.id} className={isSelected ? styles.rowSelected : ""}>
                  <td className={`${styles.td} ${styles.tdCheck}`}>
                    <label className={styles.checkLabel}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={isSelected}
                        onChange={() => toggleOne(font.id)}
                      />
                      <span className={styles.checkmark} />
                    </label>
                  </td>
                  <td className={`${styles.td} ${styles.fontName}`}>
                    {font.name}
                    {font.isFeatured && (
                      <span className={styles.featuredBadge} title="Featured">★</span>
                    )}
                  </td>
                  <td className={styles.td}>{font.designer || "—"}</td>
                  <td className={styles.td}>
                    {font.files.filter((f) => f.format === "WOFF2").map((f) => f.weight).join(", ") ||
                      (font.status === "PROCESSING" ? t("common.loading") : "Regular")}
                  </td>
                  <td className={styles.td}>{font.downloadCount}</td>
                  <td className={styles.td}>{font.viewCount}</td>
                  <td className={styles.td}>
                    <FontStatusCell
                      font={font}
                      onStatusChange={handleStatusChange}
                      onComplete={fetchAdminFonts}
                    />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <Link href={`/admin/fonts/${font.id}/edit`} className={styles.actionBtn}>
                        {t("adminFonts.btnEdit")}
                      </Link>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(font.id, font.name)}
                      >
                        {t("adminFonts.btnDelete")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {fonts.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className={styles.emptyState}>
                  {t("adminFonts.emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Floating Bulk Action Bar ── */}
      <div className={`${styles.bulkBar} ${someSelected ? styles.bulkBarVisible : ""}`}>
        <div className={styles.bulkBarLeft}>
          <span className={styles.bulkCount}>
            {selected.size} {t("adminFonts.bulkSelected")}
          </span>
          <button className={styles.bulkClearBtn} onClick={() => setSelected(new Set())}>
            {t("adminFonts.bulkClear")}
          </button>
        </div>

        <div className={styles.bulkBarActions}>
          {/* Set Status dropdown */}
          <div ref={bulkStatusRef} className={styles.bulkDropWrapper}>
            <button
              className={styles.bulkActionBtn}
              onClick={() => setBulkStatusDrop((o) => !o)}
              disabled={bulkApplying}
            >
              {t("adminFonts.bulkSetStatus")} ▾
            </button>
            {bulkStatusDrop && (
              <div className={styles.bulkDropMenu}>
                {ALL_STATUSES.filter((s) => s !== "PROCESSING").map((s) => (
                  <button
                    key={s}
                    className={styles.bulkDropItem}
                    onClick={() => handleBulkStatus(s)}
                  >
                    <span className={`${styles.statusDot} ${styles["dot" + s]}`} />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Featured toggle */}
          <button
            className={styles.bulkActionBtn}
            onClick={() => handleBulkFeatured(true)}
            disabled={bulkApplying}
          >
            ★ {t("adminFonts.bulkSetFeatured")}
          </button>
          <button
            className={styles.bulkActionBtn}
            onClick={() => handleBulkFeatured(false)}
            disabled={bulkApplying}
          >
            ☆ {t("adminFonts.bulkUnsetFeatured")}
          </button>

          {/* Delete */}
          <button
            className={`${styles.bulkActionBtn} ${styles.bulkDeleteBtn}`}
            onClick={handleBulkDelete}
            disabled={bulkApplying}
          >
            🗑 {bulkApplying ? t("adminFonts.bulkApplying") : t("adminFonts.bulkDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}
