"use client";
import { Search, Pencil, KeyRound, Power } from "lucide-react";
import type { SubareaUser } from "@/features/analysts/models";
import styles from "../crear.module.css";

export default function UsersTable({
  rows, total, page, setPage, size, setSize,
  loading, totalPages, toggleActive, setEdit, setPwdFor,
  query, setQuery, fetchList
}: any) {
  return (
    <>
      <div className={styles.listHead}>
        <h3 className={styles.cardTitle}>Usuarios por Subárea</h3>
        <div className={styles.filters}>
          <div className={styles.inputIcon}>
            <Search className={styles.inputIconI}/>
            <input
              placeholder="Buscar por userId / nombre / email"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); setPage(0); fetchList(); } }}
            />
          </div>
          <button className={styles.secondary} onClick={()=>{ setPage(0); fetchList(); }}>Buscar</button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>UserId</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.center}>Cargando…</td></tr>
            ) : rows.length ? rows.map((u: SubareaUser) => (
              <tr key={u.userId}>
                <td>{u.userId}</td>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.phone || "-"}</td>
                <td>
                  <span className={`${styles.badge} ${u.active?styles.okB:styles.errB}`}>
                    {u.active ? "Sí" : "No"}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button className={styles.iconBtn} title="Editar" onClick={()=>setEdit(u)}><Pencil/></button>
                  <button className={styles.iconBtn} title="Cambiar contraseña" onClick={()=>setPwdFor(u)}><KeyRound/></button>
                  <button className={styles.iconBtn} title={u.active?"Desactivar":"Activar"} onClick={()=>toggleActive(u)}>
                    <Power className={u.active?styles.warn:undefined}/>
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className={styles.center}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <div>Registros: {total}</div>
        <div className={styles.pager}>
          <button disabled={page<=0} onClick={()=>setPage((p:number)=>p-1)}>«</button>
          <span>{page+1} / {totalPages}</span>
          <button disabled={page+1>=totalPages} onClick={()=>setPage((p:number)=>p+1)}>»</button>
          <select value={size} onChange={(e)=>{ setPage(0); setSize(Number(e.target.value)); }}>
            {[10,20,50].map(n=><option key={n} value={n}>{n}/pág</option>)}
          </select>
        </div>
      </div>
    </>
  );
}
