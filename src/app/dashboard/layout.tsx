'use client';

import Sidebar from '@/components/dashboard/dashboard';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.surface}>{children}</div>
      </main>
    </div>
  );
}
