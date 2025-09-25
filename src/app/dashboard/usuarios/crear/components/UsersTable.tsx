"use client";
import { Search, Pencil, KeyRound, Power } from "lucide-react";
import type { SubareaUser } from "@/features/analysts/models";
import styles from "../crear.module.css";

/** Si el nombre viene dos veces pegado (A B C A B C), devolvemos solo la 1a mitad */
function dedupeName(name?: string): string {
  const s = (name || "").trim().replace(/\s+/g, " ");
  if (!s) return "";
  const parts = s.split(" ");
  const n = parts.length;
  if (n % 2 !== 0) return s; // si no es par, difícil que sea duplicación perfecta
  const first = parts.slice(0, n / 2).join(" ");
  const second = parts.slice(n / 2).join(" ");
  return first === second ? first : s;
}

function getDisplayName(u: SubareaUser): string {
  // Prioriza 'name' si existe, luego 'fullName', luego arma con first/second

  return dedupeName( u.fullName );
}

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
            <Search className={styles.inputIconI} />
            <input
              placeholder="Buscar por userId / nombre / email"
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); setPage(0); fetchList(); } }}
            />
          </div>
          <button className={styles.secondary} onClick={()=>{ setPage(0); fetchList(); }}>
            Buscar
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>USERID</th>
              <th>NOMBRE COMPLETO</th>
              <th>EMAIL</th>
              <th>TELÉFONO</th>
              <th>ACTIVO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.center}>Cargando…</td></tr>
            ) : rows.length ? rows.map((u: SubareaUser) => (
              <tr key={u.userId}>
                <td>{u.userId}</td>
                <td>{getDisplayName(u)}</td>
                <td>{u.email}</td>
                <td>{u.phone || "-"}</td>
                <td>
                  <span className={`${styles.badge} ${u.active ? styles.okB : styles.errB}`}>
                    {u.active ? "Sí" : "No"}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button className={styles.iconBtn} title="Editar" onClick={()=>setEdit(u)}><Pencil/></button>
                  <button className={styles.iconBtn} title="Cambiar contraseña" onClick={()=>setPwdFor(u)}><KeyRound/></button>
                  <button className={styles.iconBtn} title={u.active ? "Desactivar" : "Activar"} onClick={()=>toggleActive(u)}>
                    <Power className={u.active ? styles.warn : undefined}/>
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
            {[10,20,50].map((n:number)=><option key={n} value={n}>{n}/pág</option>)}
          </select>
        </div>
      </div>
    </>
  );
}
