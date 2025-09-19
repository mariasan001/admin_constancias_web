"use client";
import styles from "../crear.module.css";
import type { SubArea } from "@/features/catalogs/models";

export default function SubareaSelect({
  subareas, subWorkUnitId, setSubWorkUnitId, query, setQuery,
  page, setPage, totalPages, total
}: any) {
  return (
    <div className={styles.row2}>
      <label>
        <span>Buscar subárea</span>
        <input
          className={styles.search}
          placeholder="Escribe para filtrar…"
          value={query}
          onChange={(e) => { setPage(0); setQuery(e.target.value); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setPage(0); } }}
        />
        <small className={styles.hint}>Resultados: {total}</small>
      </label>

      <label>
        <span>Subárea</span>
        <select
          value={subWorkUnitId || ""}
          onChange={(e) => setSubWorkUnitId(e.target.value ? Number(e.target.value) : "")}
          required
          className={styles.select}
        >
          <option value="">Selecciona…</option>
          {subareas.map((sa: SubArea) => (
            <option key={sa.id} value={sa.id}>{sa.descArea}</option>
          ))}
        </select>

        <div className={styles.comboPager}>
          <button type="button" disabled={page <= 0} onClick={() => setPage((p:number) => p - 1)}>◀</button>
          <span>{page + 1} / {totalPages}</span>
          <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage((p:number) => p + 1)}>▶</button>
        </div>
      </label>
    </div>
  );
}
