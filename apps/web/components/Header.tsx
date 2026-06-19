import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoArea}>
          <Link href="/" className={styles.logoTitle}>
            پښتو فونټونه
          </Link>
          <span className={styles.logoBadge}>PRO</span>
        </div>

        <nav className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>
            کور پاڼه
          </Link>
          <Link href="/fonts" className={styles.navLink}>
            فونټونه
          </Link>
          <Link href="/categories" className={styles.navLink}>
            کټګورۍ
          </Link>
          <Link href="/api-docs" className={styles.navLink}>
            ډيولپر API
          </Link>
        </nav>

        <div>
          <Link href="/admin/login" className={styles.ctaButton}>
            اداري تخته
          </Link>
        </div>
      </div>
    </header>
  );
}
