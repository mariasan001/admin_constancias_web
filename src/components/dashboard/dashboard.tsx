'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import {
  BarChart3, NotebookPen, UserPlus, ClipboardList,
  ListChecks, FilePlus2, FileCheck2, Bell, Settings, LogOut
} from 'lucide-react';
import styles from './sidebar.module.css';

type RoleCode = 'ADMIN'|'LIDER'|'ANALISTA'|'VENTANILLA'|'USER';
type Item = {
  id: string; label: string; href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: RoleCode[];
};

const ITEMS: Item[] = [
  { id:'estadisticas', label:'Estadísticas', href:'/dashboard/estadisticas', icon:BarChart3, roles:['ADMIN','LIDER'] },
  { id:'crear-usuarios', label:'Crear usuarios', href:'/dashboard/usuarios/crear', icon:UserPlus, roles:['LIDER',] },
  { id:'asignaciones',   label:'Asignaciones',   href:'/dashboard/asignaciones',   icon:ClipboardList, roles:['LIDER','ADMIN','ANALISTA'] },
  { id:'altas-entregas', label:'Altas y entregas', href:'/dashboard/altas-entregas', icon:FileCheck2, roles:['VENTANILLA'] },
  { id:'altas',          label:'Altas',        href:'/dashboard/altas',      icon:FilePlus2, roles:['USER'] },
  { id:'seguimiento',    label:'Seguimiento',  href:'/dashboard/seguimiento', icon:ListChecks, roles:['USER'] },
  { id:'configuracion', label:'configuracion', href:'/dashboard/configuracion', icon:ListChecks, roles:['ADMIN'] },
];

export default function Sidebar(){
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  const roleSet = useMemo(() => {
    const codes = (user?.roles ?? []).map(r => (r.description ?? '').toUpperCase().trim()) as RoleCode[];
    return new Set<RoleCode>(codes);
  }, [user]);

  const menu = useMemo(() => ITEMS.filter(i => i.roles.some(r => roleSet.has(r))), [roleSet]);

  return (
    <aside className={styles.aside}>
      <div className={styles.rail}>
        {/* Marca: imagen dentro del mismo recuadro */}
        <div className={styles.brand}>
          <img src="/img/flor-2.png" alt="Marca" />
        </div>

        {/* MENU horizontal */}
        <div className={styles.menuLabel}>MENU</div>

        <nav className={styles.nav}>
          {menu.map(({ id, href, label, icon:Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={id}
                href={href}
                className={`${styles.item} ${active ? styles.active : ''}`}
                data-tip={label}
                aria-label={label}
              >
                <Icon className={styles.icon} />
              </Link>
            );
          })}
        </nav>

        <div className={styles.bottom}>
          <button className={styles.item} data-tip="Notificaciones" aria-label="Notificaciones">
            <Bell className={styles.icon} />
          </button>
          <button className={styles.item} data-tip="Configuración" aria-label="Configuración">
            <Settings className={styles.icon} />
          </button>
          <button className={styles.item} data-tip="Cerrar sesión" aria-label="Cerrar sesión" onClick={logout}>
            <LogOut className={styles.icon} />
          </button>
        </div>
      </div>
    </aside>
  );
}
