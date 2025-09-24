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
} from "@/features/tramites/tramite.service";
import type { TramiteFull, TramiteType, Analyst } from "@/features/tramites/tramite.model";

export default function AsignacionesPage() {
  const { user } = useAuthContext();
  const isAdmin   = user?.roles?.some((r) => r.description === "ADMIN") ?? false;
  const isLeader  = user?.roles?.some((r) => r.description === "LIDER") ?? false;
  const isAnalyst = user?.roles?.some((r) => r.id === 3 || r.description === "ANALISTA") ?? false;

  const canAssign       = isLeader || isAdmin;
  const canChangeType   = isLeader || isAdmin;
  const canChangeStatus = canAssign || isAnalyst;

  const defaultSub = !isAdmin ? user?.subWorkUnit?.id : undefined;

  const { rows, setRows, page, setPage, size, setSize, total, q, setQ, loading, fetchList } =
    useTramites(defaultSub);

  // UI local
  const [adeudoMap, setAdeudoMap]     = useState<Record<string, boolean>>({});
  const [montoMap, setMontoMap]       = useState<Record<string, string>>({});
  const [fileNameMap, setFileNameMap] = useState<Record<string, string>>({});

  // Detalle
  const [selected, setSelected] = useState<TramiteFull | null>(null);
  const [openFolio, setOpenFolio] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Catálogos
  const [tramiteTypes, setTramiteTypes] = useState<TramiteType[]>([]);
  useEffect(() => { (async () => {
    try { setTramiteTypes(await listTramiteTypes()); } catch (e) { console.error(e); }
  })(); }, []);

  // Analistas (solo líder/admin)
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  useEffect(() => { if (!canAssign || !defaultSub) return; (async () => {
    try { setAnalysts(await listAnalystsBySubarea(defaultSub)); } catch (e) { console.error(e); }
  })(); }, [canAssign, defaultSub]);

  // Vista analista: solo los suyos
  useEffect(() => {
    if (!isAnalyst || !user?.userId) return;
    (async () => {
      try { const res = await searchTramites({ assignedTo: user.userId, q, page, size }); setRows(res.content); }
      catch (e) { console.error("Error cargando trámites del analista:", e); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnalyst, user?.userId, q, page, size]);

  // Handlers
  const handleSelect = async (folio: string) => {
    if (openFolio === folio) { setOpenFolio(null); setSelected(null); return; }
    setLoadingDetail(true); setOpenFolio(folio);
    try { setSelected(await getTramiteByFolio(folio)); } catch (e) { console.error(e); } finally { setLoadingDetail(false); }
  };

  const [editingFolio, setEditingFolio] = useState<string | null>(null);
  const [editingStatusFolio, setEditingStatusFolio] = useState<string | null>(null);

  const handleTypeChange = async (folio: string, newTypeId: number) => {
    if (!canChangeType) return;
    try { await changeTramiteType(folio, newTypeId, "Cambio de tipo desde la tabla"); setEditingFolio(null); fetchList(); }
    catch { alert("No se pudo cambiar el tipo"); }
  };

  const handleStatusChange = async (folio: string, newStatusId: number) => {
    if (!user || !canChangeStatus) return;
    try {
      await changeTramiteStatus(folio, newStatusId, user.userId, `Cambio hecho por ${user.name}`);
      setRows(prev => prev.map(r => r.folio === folio ? { ...r, statusId: newStatusId, statusDesc: getStatusLabel(newStatusId) } : r));
      setEditingStatusFolio(null);
    } catch { alert("No se pudo cambiar el estatus"); }
  };

  // Hidratar "Asignó"
  const hydratedFoliosRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const targets = rows.filter(r => r.statusId === 2 && r.assignedAt && !r.assignedBy && !hydratedFoliosRef.current.has(r.folio));
    if (!targets.length) return;
    (async () => {
      for (const row of targets) {
        hydratedFoliosRef.current.add(row.folio);
        try {
          const detail = await getTramiteByFolio(row.folio);
          const ev = [...(detail.history.history ?? [])].reverse().find(h => (h.toStatus || "").toUpperCase() === "ASIGNADO");
          if (ev) setRows(prev => prev.map(r => r.folio === row.folio ? { ...r, assignedBy: r.assignedBy ?? ev.changedBy, assignedByName: r.assignedByName ?? ev.changedBy } : r));
        } catch (e) { console.error("No se pudo hidratar asignación de", row.folio, e); }
      }
    })();
  }, [rows, setRows]);

  const visibleRows = isAnalyst && user?.userId ? rows.filter(r => r.assignedTo === user.userId) : rows;

  // Currency helpers
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, "")) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const handleMontoInput = (folio:string, raw:string) => {
    const cleaned = raw.replace(/[^\d.-]/g, "");
    setMontoMap(m => ({ ...m, [folio]: cleaned }));
  };
  const handleMontoBlur = (folio:string) => {
    const raw = montoMap[folio] ?? "";
    setMontoMap(m => ({ ...m, [folio]: formatCurrency(raw) }));
  };

  const toggleAdeudo = (folio:string) => setAdeudoMap(a => ({ ...a, [folio]: !a[folio] }));

  const onPickEvidence = async (folio:string, f?:File) => {
    if (!f) return;
    setFileNameMap(m => ({ ...m, [folio]: f.name }));
    await handleStatusChange(folio, 3); // TERMINADO
    // TODO: subir archivo a backend cuando tengas endpoint
  };

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>Asignaciones</h1>
        <p className={styles.subtitle}>Panel institucional de distribución y seguimiento de trámites.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Tipo</th>
                <th>Estatus</th>
                <th>Asignado a</th>
                <th>Asignó</th>
                <th>Solicitante</th>
                <th>Creado</th>
                <th>En adeudo</th>
                <th>Monto</th>
                <th>Evidencia</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10}>Cargando…</td></tr>
              ) : visibleRows.length ? (
                visibleRows.map((t) => {
                  const variant = String(t.statusDesc || "").toLowerCase();
                  const typeAttr = String(t.tramiteTypeDesc || "").toLowerCase().replace(/\s+/g, "-");

                  const enAdeudo = adeudoMap[t.folio] ?? (t as any).enAdeudo ?? false;
                  const monto = montoMap[t.folio] ?? ((t as any).monto != null ? formatCurrency((t as any).monto) : "");
                  const picked = fileNameMap[t.folio];
                  const inputId = `file-${t.folio}`;

                  return (
                    <React.Fragment key={t.id}>
                      <tr>
                        {/* Folio */}
                        <td className={styles.clickable} onClick={() => handleSelect(t.folio)}>{t.folio}</td>

                        {/* Tipo */}
                        <td>
                          {!canChangeType ? (
                            <span className={styles.typePill} data-type={typeAttr}>{t.tramiteTypeDesc}</span>
                          ) : editingFolio === t.folio ? (
                            <select autoFocus value={t.tramiteTypeId}
                              onChange={(e) => handleTypeChange(t.folio, Number(e.target.value))}
                              onBlur={() => setEditingFolio(null)}>
                              {tramiteTypes.map(tp => <option key={tp.id} value={tp.id}>{tp.descArea}</option>)}
                            </select>
                          ) : (
                            <button className={styles.typePill} data-type={typeAttr} onClick={() => setEditingFolio(t.folio)}>
                              {t.tramiteTypeDesc}
                            </button>
                          )}
                        </td>

                        {/* Estatus */}
                        <td>
                          {!canChangeStatus ? (
                            <span className={styles.badge} data-variant={variant}><span className="dot" /> {t.statusDesc}</span>
                          ) : editingStatusFolio === t.folio ? (
                            <select autoFocus value={t.statusId}
                              onChange={(e) => handleStatusChange(t.folio, Number(e.target.value))}
                              onBlur={() => setEditingStatusFolio(null)}>
                              <option value={1}>RECIBIDO</option>
                              <option value={2}>ASIGNADO</option>
                              <option value={3}>TERMINADO</option>
                              <option value={4}>ENTREGADO</option>
                            </select>
                          ) : (
                            <button className={styles.badge} data-variant={variant} onClick={() => setEditingStatusFolio(t.folio)}>
                              <span className="dot" /> {t.statusDesc}
                            </button>
                          )}
                        </td>

                        {/* Asignado / Asignó / Solicitante / Creado */}
                        <td>{t.assignedToName ?? t.assignedTo ?? "—"}</td>
                        <td>{t.assignedByName ?? t.assignedBy ?? "—"}</td>
                        <td>{t.requesterId}{t.requesterName ? ` — ${t.requesterName}` : ""}</td>
                        <td>{new Date(t.createdAt).toLocaleString()}</td>

                        {/* EN ADEUDO – switch rojo */}
                        <td>
                          <button type="button"
                            className={styles.adeudoSwitch}
                            data-yn={enAdeudo ? "si" : "no"}
                            aria-pressed={enAdeudo}
                            title={enAdeudo ? "SÍ EN ADEUDO" : "NO EN ADEUDO"}
                            onClick={() => toggleAdeudo(t.folio)}
                          />
                        </td>

                        {/* MONTO – pill con $ */}
                        <td>
                          <span className={styles.money}>
                            <span>$</span>
                            <input
                              value={monto}
                              onChange={(e) => handleMontoInput(t.folio, e.target.value)}
                              onBlur={() => handleMontoBlur(t.folio)}
                              inputMode="decimal"
                              placeholder="0.00"
                            />
                          </span>
                        </td>

                        {/* EVIDENCIA – botón clip + nombre truncado */}
                        <td>
                          <div className={styles.uploadRow}>
                            <input
                              id={inputId}
                              type="file"
                              style={{ display: "none" }}
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                await onPickEvidence(t.folio, f);
                                e.currentTarget.value = "";
                              }}
                            />
                            <label htmlFor={inputId} className={styles.uploadBtn}>
                              <i className={styles.clip}></i> SUBIR
                            </label>
                            {picked ? <span className={styles.fileName}>{picked}</span> : null}
                          </div>
                        </td>
                      </tr>

                      {/* Detalle expandible */}
                      {openFolio === t.folio && selected && (
                        <tr className={styles.detailRow}>
                          <td colSpan={10}>
                            {loadingDetail ? (
                              <div className={styles.detailBox}>Cargando detalle…</div>
                            ) : (
                              <div className={styles.detailBox}>
                                <h4 className={styles.detailTitle}>Detalle del trámite</h4>
                                <div className={styles.detailGrid}>
                                  <p><b>Tipo:</b> {selected.history.tramiteType}</p>
                                  <p><b>Solicitante:</b> {selected.history.userName} ({selected.history.userId})</p>
                                  <p><b>Estatus actual:</b> {selected.history.currentStatus}</p>
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
                                                {h.fromStatus} → {h.toStatus} <span className={styles.muted}> | {h.comment}</span>
                                              </div>
                                              <small className={styles.muted}>Por {h.changedBy} · {new Date(h.changedAt).toLocaleString()}</small>
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
                                        {selected.docs.map(d => (
                                          <li key={d.id}>
                                            <span className={styles.docType}>{d.docTypeDesc}</span>
                                            <a href={d.downloadUrl} target="_blank" rel="noreferrer" className={styles.docLink}>
                                              {d.originalName}
                                            </a>
                                            <span className={styles.muted}> · {(d.sizeBytes / 1024).toFixed(1)} KB</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : <p className={styles.muted}>Sin documentos</p>}
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
                <tr><td colSpan={10}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function getStatusLabel(id:number):string{
  switch(id){case 1:return "RECIBIDO";case 2:return "ASIGNADO";case 3:return "TERMINADO";case 4:return "ENTREGADO";default:return "—";}
}
