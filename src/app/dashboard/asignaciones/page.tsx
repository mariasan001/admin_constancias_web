// src/app/(tu-ruta)/asignaciones/page.tsx
"use client";

import styles from "./asignaciones.module.css";
import { useAuthContext } from "@/context/AuthContext";
import { useTramites } from "./hooks/useTramites";
import { useEffect, useRef, useState } from "react";
import React from "react";
import {
  getTramiteByFolio,
  changeTramiteType,
  changeTramiteStatus,
  listTramiteTypes,
  listAnalystsBySubarea,
  assignTramite,
  searchTramites,
  getTramiteEvidence,
} from "@/features/tramites/tramite.service";
import type { TramiteFull, TramiteType, Analyst } from "@/features/tramites/tramite.model";

/** Title Case robusto */
function toTitleCase(input?: string): string {
  const s = (input ?? "").toLowerCase();
  return s.replace(/([\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*)/gu, (w) =>
    w.charAt(0).toUpperCase() + w.slice(1)
  );
}

/** Mapea id → etiqueta estatus */
function getStatusLabel(id: number): string {
  switch (id) {
    case 1: return "Recibido";
    case 2: return "Asignado";
    case 3: return "En Proceso";
    case 4: return "Finalizado";
    case 5: return "Entregado por ventanilla";
    default: return "—";
  }
}

const FINALIZADO_ID = 4 as const;

/** Formatea bytes de documentos */
function formatBytes(bytes?: number) {
  if (!bytes && bytes !== 0) return "";
  const k = 1024, sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(val < 10 ? 1 : 0)} ${sizes[i]}`;
}

function asNumberOrUndef(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** ⏱️ Helpers SLA */
function formatDateShort(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
}
function normalizeSla(label?: string | null): "en-tiempo" | "por-vencer" | "vencido" | "desconocido" {
  const t = (label ?? "").trim().toLowerCase();
  if (t.includes("vencid")) return "vencido";
  if (t.includes("por vencer") || t.includes("por-vencer")) return "por-vencer";
  if (t.includes("tiempo")) return "en-tiempo";
  return "desconocido";
}

/** Column widths (agregamos Vence y Tiempo al final) */
const COL_WIDTHS = [160,120,140,240,120,160,180,110,160,260,380,140,140] as const;

/** Sin espacios en <tr>: generamos headers por map */
const HEADERS = [
  "Folio (sistema)",
  "Tipo",
  "Estatus",
  "Asignado a",
  "Asignó",
  "Solicitante",
  "Creado",
  "En adeudo",
  "Monto",
  "No. de oficio",
  "Evidencia",
  "Vence",   // SLA dueDate
  "Tiempo",  // SLA label + remainingDays
] as const;

export default function AsignacionesPage() {
  const { user } = useAuthContext();
  const isAdmin   = user?.roles?.some((r) => r.description === "ADMIN") ?? false;
  const isLeader  = user?.roles?.some((r) => r.description === "LIDER") ?? false;
  const isAnalyst = user?.roles?.some((r) => r.id === 3 || r.description === "ANALISTA") ?? false;

  const canAssign       = isLeader || isAdmin;
  const canChangeType   = isLeader || isAdmin;
  const canChangeStatus = canAssign || isAnalyst;

  const defaultSub = !isAdmin ? asNumberOrUndef(user?.subWorkUnit?.id) : undefined;

  const {
    rows, setRows,
    page, setPage,
    size, setSize,
    total, q, setQ,
    loading, fetchList,
  } = useTramites(defaultSub);

  // ===== Estado UI =====
  const [adeudoMap, setAdeudoMap]           = useState<Record<string, boolean>>({});
  const [montoMap, setMontoMap]             = useState<Record<string, string>>({});
  const [noficioMap, setNoficioMap]         = useState<Record<string, string>>({});
  const [fileNameMap, setFileNameMap]       = useState<Record<string, string>>({});
  const [assigningFolio, setAssigningFolio] = useState<string | null>(null);
  const [rowSaving, setRowSaving]           = useState<string | null>(null);

  const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});
  const [uploadOkMap, setUploadOkMap]   = useState<Record<string, boolean>>({});
  const [uploadErrMap, setUploadErrMap] = useState<Record<string, string>>({});

  const [selected, setSelected]     = useState<TramiteFull | null>(null);
  const [openFolio, setOpenFolio]   = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [tramiteTypes, setTramiteTypes] = useState<TramiteType[]>([]);
  useEffect(() => { (async () => {
    try { setTramiteTypes(await listTramiteTypes()); } catch (e) { console.error(e); }
  })(); }, []);

  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  useEffect(() => {
    if (!canAssign || !defaultSub) return;
    (async () => {
      try { setAnalysts(await listAnalystsBySubarea(defaultSub)); }
      catch (e) { console.error("No se pudieron cargar analistas:", e); }
    })();
  }, [canAssign, defaultSub]);

  // Vista ANALISTA: solo sus trámites
  useEffect(() => {
    if (!isAnalyst || !user?.userId) return;
    (async () => {
      try {
        const res = await searchTramites({ assignedTo: user.userId, q, page, size });
        setRows(res.content);
      } catch (e) { console.error("Error cargando trámites del analista:", e); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnalyst, user?.userId, q, page, size]);

  // Hidratar mapas desde backend cuando lleguen filas
  useEffect(() => {
    if (!rows?.length) return;
    setAdeudoMap(prev => {
      const next = { ...prev };
      for (const r of rows) if (next[r.folio] === undefined) next[r.folio] = Boolean((r as any).enadeudo ?? false);
      return next;
    });
    setMontoMap(prev => {
      const next = { ...prev };
      for (const r of rows) if (next[r.folio] === undefined) {
        const val = (r as any).adeudo; next[r.folio] = val == null ? "" : String(val);
      }
      return next;
    });
    setNoficioMap(prev => {
      const next = { ...prev };
      for (const r of rows) if (next[r.folio] === undefined) next[r.folio] = (r as any).noficio ?? "";
      return next;
    });
    setFileNameMap(prev => {
      const next = { ...prev };
      for (const r of rows) if (next[r.folio] === undefined) {
        const ev = (r as any).evidencia ?? ""; next[r.folio] = ev ? ev.split("/").pop() || ev : "";
      }
      return next;
    });
  }, [rows]);

  const handleSelect = async (folio: string) => {
    if (openFolio === folio) { setOpenFolio(null); setSelected(null); return; }
    setLoadingDetail(true); setOpenFolio(folio);
    try { setSelected(await getTramiteByFolio(folio)); }
    catch (e) { console.error("Error obteniendo detalle:", e); }
    finally { setLoadingDetail(false); }
  };

  const [editingFolio, setEditingFolio] = useState<string | null>(null);
  const [editingStatusFolio, setEditingStatusFolio] = useState<string | null>(null);

  const handleTypeChange = async (folio: string, newTypeId: number) => {
    if (!canChangeType) return;
    try {
      await changeTramiteType(folio, newTypeId, "Cambio de tipo desde la tabla");
      setEditingFolio(null);
      fetchList();
    } catch { alert("No se pudo cambiar el tipo"); }
  };

  const handleStatusChange = async (folio: string, newStatusId: number) => {
    if (!canChangeStatus || !user) return;
    const row = rows.find(r => r.folio === folio);
    const current = row?.statusId;
    if (newStatusId === 5 && current !== 4) {
      alert("Para ENTREGAR POR VENTANILLA (5) el trámite debe estar FINALIZADO (4).");
      setEditingStatusFolio(null);
      return;
    }
    const of = (noficioMap[folio] ?? "").trim();
    const hasOficioNoAdeudo = !!of && !(adeudoMap[folio] ?? false);

    try {
      await changeTramiteStatus(folio, newStatusId, {
        actorUserId: user.userId,
        noficioNoAdeudo: hasOficioNoAdeudo ? of : undefined,
      });
      setRows(prev => prev.map(r =>
        r.folio === folio ? { ...r, statusId: newStatusId, statusDesc: getStatusLabel(newStatusId) } : r
      ));
      setEditingStatusFolio(null);
    } catch { alert("No se pudo cambiar el estatus"); }
  };

  const handleAssign = async (folio: string, assigneeUserId: string) => {
    if (!canAssign) return;
    try {
      setRowSaving(folio);
      const chosenName = analysts.find((a) => a.userId === assigneeUserId)?.name ?? assigneeUserId;
      const res = await assignTramite(folio, assigneeUserId);
      setRows(prev => prev.map(r =>
        r.folio === folio
          ? {
              ...r,
              assignedTo: res?.assigneeUserId ?? assigneeUserId,
              assignedToName: res?.assigneeName ?? chosenName,
              assignedBy: res?.assignedBy ?? user?.userId,
              assignedByName: res?.assignedByName ?? user?.name,
              assignedAt: res?.assignedAt ?? new Date().toISOString(),
              statusId: 2, statusDesc: "Asignado",
            }
          : r
      ));
    } catch (e) { console.error(e); alert("No se pudo asignar el trámite."); }
    finally { setAssigningFolio(null); setRowSaving(null); }
  };

  const hydratedFoliosRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const targets = rows.filter(
      (r) => r.statusId === 2 && r.assignedAt && !r.assignedBy && !hydratedFoliosRef.current.has(r.folio)
    );
    if (!targets.length) return;
    (async () => {
      for (const row of targets) {
        hydratedFoliosRef.current.add(row.folio);
        try {
          const detail = await getTramiteByFolio(row.folio);
          const ev = [...(detail.history.history ?? [])]
            .reverse()
            .find((h) => (h.toStatus || "").toUpperCase() === "ASIGNADO");
          if (ev) {
            setRows(prev => prev.map(r =>
              r.folio === row.folio
                ? { ...r, assignedBy: r.assignedBy ?? ev.changedBy, assignedByName: r.assignedByName ?? ev.changedBy }
                : r
            ));
          }
        } catch (e) { console.error("No se pudo hidratar asignación de", row.folio, e); }
      }
    })();
  }, [rows, setRows]);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, "")) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const handleMontoInput = (folio: string, raw: string) => {
    const cleaned = raw.replace(/[^\d.-]/g, "");
    setMontoMap((m) => ({ ...m, [folio]: cleaned }));
  };
  const handleMontoBlur = (folio: string) => {
    const raw = montoMap[folio] ?? "";
    setMontoMap((m) => ({ ...m, [folio]: formatCurrency(raw) }));
  };
  const handleNoficioInput = (folio: string, v: string) => {
    setNoficioMap(m => ({ ...m, [folio]: v }));
  };
  const toggleAdeudo = (folio: string) =>
    setAdeudoMap((a) => ({ ...a, [folio]: !a[folio] }));

  const onPickEvidence = async (folio: string, f?: File) => {
    if (!f || !user) return;
    setUploadErrMap(m => ({ ...m, [folio]: "" }));
    setUploadOkMap(m => ({ ...m, [folio]: false }));
    setUploadingMap(m => ({ ...m, [folio]: true }));

    const enAdeudo = adeudoMap[folio] ?? false;
    const rawMonto = (montoMap[folio] ?? "").replace(/[^\d.-]/g, "");
    const adeudo = Number(rawMonto || 0);
    const noficio = (noficioMap[folio] ?? "").trim();
    if (!noficio) {
      setUploadingMap(m => ({ ...m, [folio]: false }));
      setUploadErrMap(m => ({ ...m, [folio]: "Escribe el No. de oficio antes de subir." }));
      return;
    }
    try {
      await changeTramiteStatus(folio, FINALIZADO_ID, {
        actorUserId: user.userId,
        evidencia: f,
        fin_adeudo: adeudo,
        fin_noficio: noficio,
        fin_enAdeudo: !!enAdeudo,
      });
      setRows(prev => prev.map(r =>
        r.folio === folio ? { ...r, statusId: FINALIZADO_ID, statusDesc: getStatusLabel(FINALIZADO_ID) } : r
      ));
      setFileNameMap((m) => ({ ...m, [folio]: f.name }));
      setUploadOkMap(m => ({ ...m, [folio]: true }));
      await fetchList();
    } catch (e: any) {
      console.error("Error al subir evidencia:", e);
      const msg = e?.response?.data?.message || e?.message || "No se pudo finalizar con evidencia.";
      setUploadErrMap(m => ({ ...m, [folio]: msg }));
    } finally {
      setUploadingMap(m => ({ ...m, [folio]: false }));
    }
  };

  // ====== Ver / Descargar evidencia ======
  const viewEvidence = async (folio: string) => {
    try {
      const { blob } = await getTramiteEvidence(folio, true);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir la evidencia.");
    }
  };

  const downloadEvidence = async (folio: string) => {
    try {
      const { blob, filename } = await getTramiteEvidence(folio, false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `evidencia-${folio}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("No se pudo descargar la evidencia.");
    }
  };
  // ======================================

  const visibleRows = isAnalyst && user?.userId ? rows.filter(r => r.assignedTo === user.userId) : rows;

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Asignaciones</h1>
        <p className={styles.subtitle}>Panel institucional de distribución y seguimiento de trámites.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrap} role="region" aria-label="Tabla de asignaciones con desplazamiento horizontal">
          <table className={styles.table}>
            <colgroup>
              {COL_WIDTHS.map((w, i) => <col key={i} style={{ width: w }} />)}
            </colgroup>

            <thead>
              <tr>{HEADERS.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={COL_WIDTHS.length}>Cargando…</td></tr>
              ) : visibleRows.length ? (
                visibleRows.map((t) => {
                  const variant  = String(t.statusDesc || "").toLowerCase();
                  const typeAttr = String(t.tramiteTypeDesc || "").toLowerCase().replace(/\s+/g, "-");

                  const enAdeudo = (t as any).enadeudo ?? adeudoMap[t.folio] ?? false;
                  const montoVal = montoMap[t.folio] ?? ((t as any).adeudo != null ? String((t as any).adeudo) : "");
                  const picked   = fileNameMap[t.folio];
                  const inputId  = `file-${t.folio}`;
                  const noficio  = noficioMap[t.folio] ?? (t as any).noficio ?? "";
                  const isUploading = !!uploadingMap[t.folio];

                  return (
                    <React.Fragment key={t.id}>
                      <tr>
                        <td className={styles.clickable} onClick={() => handleSelect(t.folio)}>{t.folio}</td>
                        <td>
                          {!canChangeType ? (
                            <span className={styles.typePill} data-type={typeAttr}>{toTitleCase(t.tramiteTypeDesc)}</span>
                          ) : editingFolio === t.folio ? (
                            <select
                              autoFocus
                              value={t.tramiteTypeId}
                              onChange={(e) => handleTypeChange(t.folio, Number(e.target.value))}
                              onBlur={() => setEditingFolio(null)}
                            >
                              {tramiteTypes.map((tp) => (
                                <option key={tp.id} value={tp.id}>{toTitleCase(tp.descArea)}</option>
                              ))}
                            </select>
                          ) : (
                            <button className={styles.typePill} data-type={typeAttr} onClick={() => setEditingFolio(t.folio)}>
                              {toTitleCase(t.tramiteTypeDesc)}
                            </button>
                          )}
                        </td>

                        <td>
                          {!canChangeStatus ? (
                            <span className={styles.badge} data-variant={variant}><span className="dot" /> {toTitleCase(t.statusDesc)}</span>
                          ) : editingStatusFolio === t.folio ? (
                            <select
                              autoFocus
                              value={t.statusId}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (v === FINALIZADO_ID) {
                                  alert("Para marcar como FINALIZADO debes subir evidencia y llenar los datos requeridos.");
                                  setEditingStatusFolio(null);
                                  return;
                                }
                                handleStatusChange(t.folio, v);
                              }}
                              onBlur={() => setEditingStatusFolio(null)}
                            >
                              <option value={1}>Recibido</option>
                              <option value={2}>Asignado</option>
                              <option value={3}>En Proceso</option>
                              <option value={5}>Entregado por ventanilla</option>
                            </select>
                          ) : (
                            <button className={styles.badge} data-variant={variant} onClick={() => setEditingStatusFolio(t.folio)}>
                              <span className="dot" /> {toTitleCase(t.statusDesc)}
                            </button>
                          )}
                        </td>

                        <td>
                          {!canAssign ? (
                            toTitleCase(t.assignedToName ?? t.assignedTo ?? "—")
                          ) : assigningFolio === t.folio ? (
                            <select
                              autoFocus
                              className={styles.assigneeSelect}
                              value={t.assignedTo ?? ""}
                              onChange={(e) => handleAssign(t.folio, e.target.value)}
                              onBlur={() => setAssigningFolio(null)}
                            >
                              <option value="">— Selecciona Analista —</option>
                              {analysts.map((a) => (
                                <option key={a.userId} value={a.userId}>{toTitleCase(a.name)}</option>
                              ))}
                            </select>
                          ) : (
                            <button className={styles.assigneeBtn} onClick={() => setAssigningFolio(t.folio)} title="Cambiar asignación">
                              {toTitleCase(t.assignedToName ?? "Asignar")}
                            </button>
                          )}
                          {rowSaving === t.folio ? <small className={styles.muted}>&nbsp;Guardando…</small> : null}
                        </td>

                        <td>{toTitleCase(t.assignedByName ?? t.assignedBy ?? "—")}</td>
                        <td>{t.requesterId}{t.requesterName ? ` — ${toTitleCase(t.requesterName)}` : ""}</td>
                        <td>{new Date(t.createdAt).toLocaleString()}</td>

                        <td>
                          <button
                            type="button"
                            className={styles.adeudoSwitch}
                            data-yn={enAdeudo ? "si" : "no"}
                            aria-pressed={enAdeudo}
                            title={enAdeudo ? "Sí en adeudo" : "No en adeudo"}
                            onClick={() => toggleAdeudo(t.folio)}
                          />
                        </td>

                        <td>
                          <span className={styles.money}>
                            <span>$</span>
                            <input
                              value={montoVal}
                              onChange={(e) => handleMontoInput(t.folio, e.target.value)}
                              onBlur={() => handleMontoBlur(t.folio)}
                              inputMode="decimal"
                              placeholder="0.00"
                            />
                          </span>
                        </td>

                        <td>
                          <input
                            className={styles.noficioInput}
                            value={noficio}
                            placeholder="Sin número de oficio"
                            onChange={(e) => handleNoficioInput(t.folio, e.target.value)}
                          />
                        </td>

                        <td>
                          <div className={styles.uploadRow}>
                            <input
                              id={inputId}
                              type="file"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const input = e.currentTarget as HTMLInputElement;
                                const f = input.files?.[0];
                                onPickEvidence(t.folio, f).finally(() => { input.value = ""; });
                              }}
                            />
                            <label htmlFor={inputId} className={styles.uploadBtn} aria-disabled={isUploading}>
                              <i className={styles.clip}></i> Subir
                            </label>

                            {picked
                              ? <span className={styles.fileName}>{toTitleCase(picked)}</span>
                              : <span className={styles.muted}>Sin evidencia</span>}

                            {picked && !isUploading && (
                              <>
                                <button
                                  type="button"
                                  className={styles.linkBtn}
                                  onClick={() => viewEvidence(t.folio)}
                                  title="Ver evidencia"
                                >
                                  Ver
                                </button>
                                <button
                                  type="button"
                                  className={styles.linkBtn}
                                  onClick={() => downloadEvidence(t.folio)}
                                  title="Descargar evidencia"
                                >
                                  Descargar
                                </button>
                              </>
                            )}

                            {isUploading && <span className={styles.uploadInfo}>Subiendo…</span>}
                            {uploadOkMap[t.folio] && !isUploading && <span className={styles.uploadOk}>✓ Subido</span>}
                            {uploadErrMap[t.folio] && !isUploading && (
                              <span className={styles.uploadErr}>⚠ {uploadErrMap[t.folio]}</span>
                            )}
                          </div>
                        </td>

                        {/* Vence */}
                        <td>{formatDateShort((t as any).dueDate)}</td>

                        {/* Tiempo (SLA) */}
                        <td>
                          {(() => {
                            const label = (t as any).slaLabel ?? "—";
                            const days = (t as any).remainingDays;
                            const v = normalizeSla(label);
                            return (
                              <span className={styles.badge} data-variant={v} title={`Días restantes: ${days ?? "—"}`}>
                                {label}{Number.isFinite(days) ? ` (${days} d)` : ""}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>

                      {openFolio === t.folio && selected && (
                        <tr className={styles.detailRow}>
                          <td colSpan={COL_WIDTHS.length}>
                            {loadingDetail ? (
                              <div className={styles.detailBox}>Cargando detalle…</div>
                            ) : (
                              <div className={styles.detailBox}>
                                <h4 className={styles.detailTitle}>Detalle del trámite</h4>

                                <div className={styles.detailGrid}>
                                  <p><b>Tipo:</b> {toTitleCase(selected.history.tramiteType)}</p>
                                  <p><b>Solicitante:</b> {toTitleCase(selected.history.userName)} ({selected.history.userId})</p>
                                  <p><b>Estatus actual:</b> {toTitleCase(selected.history.currentStatus)}</p>
                                  <p><b>Creado:</b> {new Date(selected.history.createdAt).toLocaleString()}</p>
                                </div>

                                <div className={styles.detailColumns}>
                                  <div>
                                    <h5>Historial</h5>
                                    {selected.history.history?.length ? (
                                      <ul className={styles.timeline}>
                                        {selected.history.history.map((h, i) => (
                                          <li key={i}>
                                            <span className={styles.timelineDot} />
                                            <div>
                                              <div className={styles.timelineLine}>
                                                {toTitleCase(h.fromStatus)} → {toTitleCase(h.toStatus)}
                                                {h.comment ? <span className={styles.muted}> | {toTitleCase(h.comment)}</span> : null}
                                              </div>
                                              <small className={styles.muted}>
                                                Por {toTitleCase(h.changedBy)} · {new Date(h.changedAt).toLocaleString()}
                                              </small>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : <p className={styles.muted}>Sin historial</p>}
                                  </div>

                                  <div>
                                    <h5>Documentos</h5>
                                    {selected.docs?.length ? (
                                      <ul className={styles.docs}>
                                        {selected.docs.map((d) => (
                                          <li key={d.id}>
                                            <span className={styles.docType}>{toTitleCase(d.docTypeDesc)}</span>
                                            <a className={styles.docLink} href={d.downloadUrl} target="_blank" rel="noopener noreferrer">
                                              {d.originalName}
                                            </a>
                                            <small className={styles.muted}>
                                              · {formatBytes(d.sizeBytes)} · {new Date(d.uploadedAt).toLocaleString()}
                                            </small>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (<p className={styles.muted}>Sin documentos</p>)}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr><td colSpan={COL_WIDTHS.length}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
