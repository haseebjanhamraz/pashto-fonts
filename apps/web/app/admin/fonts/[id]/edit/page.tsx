"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import styles from "./edit.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function EditFontPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [designer, setDesigner] = useState("");
  const [publisher, setPublisher] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);
  const [supportsPashto, setSupportsPashto] = useState(false);
  const [supportsUrdu, setSupportsUrdu] = useState(false);
  const [supportsArabic, setSupportsArabic] = useState(false);
  const [supportsPersian, setSupportsPersian] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (!stored) {
      router.push("/admin/login");
      return;
    }

    const init = async () => {
      try {
        // Fetch categories
        const catRes = await fetch(`${API_BASE_URL}/api/categories`);
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.data);
        }

        // Fetch font detail
        const token = JSON.parse(stored).token;
        const fontRes = await fetch(`${API_BASE_URL}/api/admin/fonts/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        const fontData = await fontRes.json();
        if (!fontRes.ok || !fontData.success) {
          throw new Error(fontData.error?.message || "Failed to load font details.");
        }

        const font = fontData.data;
        setName(font.name || "");
        setSlug(font.slug || "");
        setDesigner(font.designer || "");
        setPublisher(font.publisher || "");
        setDescription(font.description || "");
        setSourceUrl(font.sourceUrl || "");
        setCategoryId(font.categoryId || "");
        setStatus(font.status || "DRAFT");
        setIsFeatured(font.isFeatured || false);
        setSupportsPashto(font.supportsPashto || false);
        setSupportsUrdu(font.supportsUrdu || false);
        setSupportsArabic(font.supportsArabic || false);
        setSupportsPersian(font.supportsPersian || false);
      } catch (err: any) {
        setMessage({ type: "error", text: err.message || "Failed to load page data." });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const stored = localStorage.getItem("adminUser");
    if (!stored) {
      router.push("/admin/login");
      return;
    }

    const token = JSON.parse(stored).token;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/fonts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          designer: designer || null,
          publisher: publisher || null,
          description: description || null,
          sourceUrl: sourceUrl || null,
          categoryId: categoryId || null,
          status,
          isFeatured,
          supportsPashto,
          supportsUrdu,
          supportsArabic,
          supportsPersian,
        }),
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to update font.");
      }

      setMessage({ type: "success", text: "فونټ په بریا سره نوی شو!" });
      setTimeout(() => {
        router.push("/admin/fonts");
      }, 1500);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h3>معلومات پورته کیږي...</h3>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link href="/admin/fonts" className={styles.backBtn}>
        ← د فونټونو لیست ته بیرته تلل
      </Link>
      
      <div className={styles.card}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>د فونټ معلومات سمول</h1>
        </div>

        {message && (
          <div className={`${styles.statusMessage} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>فونټ نوم (Name) *</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>سلیګ (Slug) *</label>
            <input
              type="text"
              className={styles.input}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>کټګوري (Category)</label>
            <select
              className={styles.select}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">کټګوري غوره کړئ</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>ډیزاینر (Designer)</label>
            <input
              type="text"
              className={styles.input}
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>خپرونکی (Publisher)</label>
            <input
              type="text"
              className={styles.input}
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>سرچینه URL (Source URL)</label>
            <input
              type="url"
              className={styles.input}
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>تفصیل (Description)</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>حالت (Status)</label>
            <select
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="PRIVATE">PRIVATE</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="isFeatured"
              className={styles.checkbox}
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <label htmlFor="isFeatured" className={styles.label} style={{ cursor: "pointer" }}>
              دا فونټ ځانګړی (Featured) کړئ
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="supportsPashto"
              className={styles.checkbox}
              checked={supportsPashto}
              onChange={(e) => setSupportsPashto(e.target.checked)}
            />
            <label htmlFor="supportsPashto" className={styles.label} style={{ cursor: "pointer" }}>
              پښتو (Pashto) ملاتړ
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="supportsUrdu"
              className={styles.checkbox}
              checked={supportsUrdu}
              onChange={(e) => setSupportsUrdu(e.target.checked)}
            />
            <label htmlFor="supportsUrdu" className={styles.label} style={{ cursor: "pointer" }}>
              اردو (Urdu) ملاتړ
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="supportsArabic"
              className={styles.checkbox}
              checked={supportsArabic}
              onChange={(e) => setSupportsArabic(e.target.checked)}
            />
            <label htmlFor="supportsArabic" className={styles.label} style={{ cursor: "pointer" }}>
              عربي (Arabic) ملاتړ
            </label>
          </div>

          <div className={styles.checkboxGroup}>
            <input
              type="checkbox"
              id="supportsPersian"
              className={styles.checkbox}
              checked={supportsPersian}
              onChange={(e) => setSupportsPersian(e.target.checked)}
            />
            <label htmlFor="supportsPersian" className={styles.label} style={{ cursor: "pointer" }}>
              فارسي (Persian) ملاتړ
            </label>
          </div>

          <div className={styles.btnGroup}>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={saving}
            >
              {saving ? "خوندي کیږي..." : "خوندي کول (Save)"}
            </button>
            <Link
              href="/admin/fonts"
              className={`${styles.btn} ${styles.btnSecondary}`}
              style={{ textDecoration: "none" }}
            >
              لغوه کول (Cancel)
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
