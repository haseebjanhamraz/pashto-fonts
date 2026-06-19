"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (!stored) {
      router.push("/admin/login");
    } else {
      setAdmin(JSON.parse(stored));
      setLoading(false);
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("adminUser");
      router.push("/admin/login");
    } catch (error) {
      console.error("[Dashboard] Logout failed:", error);
      // Fallback client-side logout
      localStorage.removeItem("adminUser");
      router.push("/admin/login");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h3>بارول کیږي...</h3>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.brand}>اداري کنټرول تخته</div>
          {admin && (
            <div className={styles.adminInfo}>
              <span className={styles.adminName}>
                {admin.name} ({admin.role})
              </span>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                وتل (Logout)
              </button>
            </div>
          )}
        </div>
      </header>

      <main className={styles.container}>
        {/* Welcome Section */}
        <section className={styles.welcomeCard}>
          <h1 className={styles.welcomeTitle}>سلام، ښه راغلاست!</h1>
          <p className={styles.welcomeDesc}>
            دلته تاسو کولی شئ د پښتو فونټونو کتابتون اداره کړئ، نوي فونټونه اضافه کړئ او احصایې وګورئ.
          </p>
        </section>

        {/* Stats Grid */}
        <section className={styles.grid}>
          <div className={styles.statCard}>
            <span className={styles.statTitle}>موجود فونټونه</span>
            <span className={styles.statValue}>1</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statTitle}>کټګورۍ</span>
            <span className={styles.statValue}>10</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statTitle}>ډاونلوډونه</span>
            <span className={styles.statValue}>0</span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statTitle}>سیسټم حالت</span>
            <span className={styles.statValue} style={{ color: "#059669", fontSize: "1.5rem" }}>
              فعال (Online)
            </span>
          </div>
        </section>

        {/* Action Panel */}
        <section className={styles.actionsCard}>
          <h2 className={styles.actionsTitle}>اداري چټک عملیات</h2>
          <div className={styles.actionGrid}>
            <Link href="/admin/fonts/upload" className={styles.actionBtn}>
              📥 نوی فونټ اضافه کړئ (Upload)
            </Link>
            <Link href="/admin/fonts" className={styles.actionBtn}>
              ⚙️ د فونټونو لیست اداره کړئ
            </Link>
            <Link href="/" className={styles.actionBtn}>
              👁️ د کارونکي مخ وګورئ
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
