'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import styles from './page.module.css';

function pickHomePath(roleCodes: string[]): string {
  const has = (r: string) => roleCodes.includes(r);
  if (has('ADMIN') || has('LIDER')) return '/dashboard/estadisticas';
  if (has('ANALISTA')) return '/dashboard/seguimientos';
  if (has('VENTANILLA')) return '/dashboard/altas';        // o '/dashboard/altas-entregas'
  return '/dashboard/seguimiento';                          // USER por defecto
}

export default function DashboardPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const roleCodes = useMemo(
    () => (user?.roles ?? []).map(r => (r.description || '').toUpperCase().trim()),
    [user]
  );

  useEffect(() => {
    if (loading) return;
    const path = pickHomePath(roleCodes);
    router.replace(path);
  }, [loading, roleCodes, router]);

  // Skeleton mientras decidimos a dónde ir
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonLine} />
      </div>
    </main>
  );
}
