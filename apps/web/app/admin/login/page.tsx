"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (stored) {
      router.push("/admin/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "ننوتنه ناکامه شوه. مهرباني وکړئ معلومات وګورئ.");
      }

      // Store basic info in localStorage for client-side state mapping (optional, token is in HTTP-only cookie)
      localStorage.setItem("adminUser", JSON.stringify(result.data));

      // Redirect to admin dashboard
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "یو ناڅاپي تېروتنه رامنځته شوه.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>اداري ننوتنه</h1>
          <p className={styles.desc}>پښتو فونټونو اداري تختې ته دننه شئ.</p>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">
              بریښنالیک پته (Email Address)
            </label>
            <input
              type="email"
              id="email"
              className={styles.input}
              placeholder="admin@pashtofonts.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              پټ نوم (Password)
            </label>
            <input
              type="password"
              id="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "ننوتل..." : "تختې ته ننوتل"}
          </button>
        </form>

        <Link href="/" className={styles.backHome}>
          ← بیرته اصلي پاڼې ته
        </Link>
      </div>
    </main>
  );
}
