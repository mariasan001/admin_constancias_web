// src/app/dashboard/config/sla/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./document-sla.module.css";
import {
  listDocumentSlas,
  createDocumentSla,
  updateDocumentSla,
  deleteDocumentSla,
  activateDocumentSla,
  deactivateDocumentSla,
  getDocumentSla,
} from "@/features/document-sla/documentSla.service";
import type { DocumentSla } from "@/features/document-sla/documentSla.model";

const HEADERS = [
  "Código",
  "Nombre",
  "Días de respuesta",
  "Días hábiles",
  "Días de gracia",
  "Activo",
  "Creado",
  "Actualizado",
  "Acciones",
] as const;

const COLS = [140, 220, 160, 130, 140, 110, 180, 180, 220] as const;

function yesNo(v?: boolean) { return v ? "Sí" : "No"; }
function dt(s?: string) { try { return s ? new Date(s).toLocaleString() : "—"; } catch { return "—"; } }

type FormState = {
  id?: number;
  code: string;
  name: string;
  responseDays: string;
  workingDays: boolean;
  graceDays: string;
};

const emptyForm: FormState = {
  code: "",
  name: "",
  responseDays: "",
  workingDays: true,
  graceDays: "0",
};

export default function DocumentSlaConfigPage() {
  const [rows, setRows] = useState<DocumentSla[]>([]);
  const [q, setQ] = useState("");
  const [activeOnly, setActiveOnly] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>("");

  const pages = useMemo(
    () => Math.max(1, Math.ceil(total / (size || 1))),
    [total, size]
  );

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await listDocumentSlas({
        q: q || undefined,
        activeOnly,
        page,
        size,
        sort: "name,asc",
      });
      setRows(res.content);
      setTotal(res.totalElements);
    } catch (e) {
      console.error(e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); /* eslint-disable react-hooks/exhaustive-deps */ }, [q, activeOnly, page, size]);

  const openCreate = () => {
    setErr("");
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = async (id: number) => {
    setErr("");
    try {
      const r = await getDocumentSla(id);
      setForm({
        id: r.id,
        code: r.code,
        name: r.name,
        responseDays: String(r.responseDays ?? ""),
        workingDays: !!r.workingDays,
        graceDays: String(r.graceDays ?? "0"),
      });
      setModalOpen(true);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar Tiempos.");
    }
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const onChange = (k: keyof FormState, v: string | boolean) => {
    setForm(f => ({ ...f, [k]: v } as FormState));
  };

  const validate = (): string | null => {
    if (!form.code.trim()) return "El código es requerido.";
    if (!form.name.trim()) return "El nombre es requerido.";
    const rd = Number(form.responseDays);
    if (!Number.isFinite(rd) || rd < 0) return "Días de respuesta inválidos.";
    const gd = Number(form.graceDays);
    if (!Number.isFinite(gd) || gd < 0) return "Días de gracia inválidos.";
    return null;
  };

  const save = async () => {
    const v = validate();
    if (v) return setErr(v);
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        responseDays: Number(form.responseDays),
        workingDays: !!form.workingDays,
        graceDays: Number(form.graceDays),
      };
      if (form.id) {
        await updateDocumentSla(form.id, payload);
      } else {
        await createDocumentSla(payload);
      }
      setModalOpen(false);
      await fetchList();
    } catch (e: any) {
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: DocumentSla) => {
    try {
      if (row.isActive) await deactivateDocumentSla(row.id);
      else await activateDocumentSla(row.id);
      await fetchList();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el estado.");
    }
  };

  const onDelete = async (row: DocumentSla) => {
    if (!confirm(`¿Eliminar TIEMPO "${row.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteDocumentSla(row.id);
      await fetchList();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar.");
    }
  };

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <h1 className={styles.title}>Configuración · Tiempos de Respuestas</h1>
        <p className={styles.subtitle}>Asigna tiempos por dependencia/tipo de documento.</p>
      </header>

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.field}>
          <label className={styles.label}>Buscar</label>
          <input
            value={q}
            onChange={(e) => { setPage(0); setQ(e.target.value); }}
            placeholder="Código o nombre…"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Solo activos</label>
          <select
            value={activeOnly === true ? "true" : activeOnly === false ? "false" : ""}
            onChange={(e) => {
              const v = e.target.value;
              setPage(0);
              setActiveOnly(v === "" ? undefined : v === "true");
            }}
            className={styles.select}
          >
            <option value="">— Todos —</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className={styles.spacer} />

        <button onClick={openCreate} className={styles.btnPrimary}>
          + Nuevo tiempo
        </button>
      </div>

      {/* Tabla */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <colgroup>{COLS.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
          <thead>
            <tr>{HEADERS.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className={styles.tdCenter} colSpan={COLS.length}>Cargando…</td></tr>
            ) : rows.length ? (
              rows.map(r => (
                <tr key={r.id}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.responseDays}</td>
                  <td>{yesNo(r.workingDays)}</td>
                  <td>{r.graceDays}</td>
                  <td>
                    <span className={`${styles.badge} ${r.isActive ? styles.badgeActive : styles.badgeMuted}`}>
                      {yesNo(r.isActive)}
                    </span>
                  </td>
                  <td>{dt(r.createdAt)}</td>
                  <td>{dt(r.updatedAt)}</td>
                  <td className={styles.actions}>
                    <button className={styles.btn} onClick={() => openEdit(r.id)}>Editar</button>
                    <button className={styles.btn} onClick={() => toggleActive(r)}>
                      {r.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => onDelete(r)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td className={styles.tdCenter} colSpan={COLS.length}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className={styles.pager}>
        <span className={styles.total}>Total: {total}</span>
        <div className={styles.spacer} />
        <label className={styles.pageSizeLabel}>
          Tamaño:&nbsp;
          <select value={size} onChange={(e) => { setPage(0); setSize(Number(e.target.value)); }} className={styles.select}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button disabled={page<=0} onClick={() => setPage(p => Math.max(0, p-1))} className={styles.btnPage}>‹</button>
        <span className={styles.pageInfo}>{page+1} / {pages}</span>
        <button disabled={page>=pages-1} onClick={() => setPage(p => Math.min(pages-1, p+1))} className={styles.btnPage}>›</button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{form.id ? "Editar Tiempo" : "Nuevo Timepo"}</h3>
              <button onClick={closeModal} className={styles.modalClose}>✕</button>
            </div>

            {err ? <p className={styles.error}>{err}</p> : null}

            <div className={styles.formGrid}>
              <div>
                <label className={styles.label}>Código</label>
                <input
                  className={styles.input}
                  value={form.code}
                  onChange={(e) => onChange("code", e.target.value)}
                  placeholder="Ej. FIN, HL, NA…"
                />
              </div>
              <div>
                <label className={styles.label}>Días de respuesta</label>
                <input
                  className={styles.input}
                  value={form.responseDays}
                  onChange={(e) => onChange("responseDays", e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="Ej. 5"
                />
              </div>
              <div className={styles.colSpan2}>
                <label className={styles.label}>Nombre</label>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="Nombre visible"
                />
              </div>
              <div>
                <label className={styles.label}>Días de gracia</label>
                <input
                  className={styles.input}
                  value={form.graceDays}
                  onChange={(e) => onChange("graceDays", e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  placeholder="0"
                />
              </div>
              <div className={styles.checkboxRow}>
                <input
                  id="workingDays"
                  type="checkbox"
                  checked={form.workingDays}
                  onChange={(e) => onChange("workingDays", e.target.checked)}
                />
                <label htmlFor="workingDays">Contar solo días hábiles</label>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={closeModal} className={styles.btn}>Cancelar</button>
              <button onClick={save} disabled={saving} className={styles.btnPrimary}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
