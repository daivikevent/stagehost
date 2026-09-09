import type { Metadata } from 'next';
import styles from './auth-layout.module.css';

export const metadata: Metadata = {
  title: 'Auth',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.authLayout}>
      <div className={styles.glowTopRight} />
      <div className={styles.glowBottomLeft} />
      {children}
    </div>
  );
}
