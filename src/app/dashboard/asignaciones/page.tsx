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
} from "@/features/tramites/tramite.service";
import type { TramiteFull, TramiteType, Analyst } from "@/features/tramites/tramite.model";

export default function AsignacionesPage() {
  const { user } = useAuthContext();
  const isAdmin   = user?.roles?.some((r) => r.description === "ADMIN") ?? false;
  const isLeader  = user?.roles?.some((r) => r.description === "LIDER") ?? false;
  const isAnalyst = user?.roles?.some((r) => r.id === 3 || r.description === "ANALISTA") ?? false;

  // Permisos finos
  const canAssign       = isLeader || isAdmin;
  const canChangeType   = isLeader || isAdmin;          // 👈 ANALISTA no puede cambiar tipo
  const canChangeStatus = canAssign || isAnalyst;       // 👈 ANALISTA sí puede cambiar estatus

  const defaultSub = !isAdmin ? user?.subWorkUnit?.id : undefined;

  const {
    rows,
    setRows,
    page,
    setPage,
    size,
    setSize,
    total,
    q,
    setQ,
    loading,
    fetchList,
  } = useTramites(defaultSub);

  // -------- Detalle --------
  const [selected, setSelected] = useState<TramiteFull | null>(null);
  const [openFolio, setOpenFolio] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // -------- Catálogos --------
  const [tramiteTypes, setTramiteTypes] = useState<TramiteType[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const types = await listTramiteTypes();
        setTramiteTypes(types);
      } catch (err) {
        console.error("Error cargando tipos de trámite:", err);
      }
    })();
  }, []);

  // -------- Analistas (solo LÍDER para asignar) --------
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  useEffect(() => {
    if (!canAssign || !defaultSub) return;
    (async () => {
      try {
        const list = await listAnalystsBySubarea(defaultSub);
        setAnalysts(list);
      } catch (e) {
        console.error("No se pudieron cargar analistas:", e);
      }
    })();
  }, [canAssign, defaultSub]);

  // 🔒 Vista de ANALISTA: ver SOLO lo asignado a él/ella
  useEffect(() => {
    if (!isAnalyst || !user?.userId) return;
    (async () => {
      try {
        const res = await searchTramites({ assignedTo: user.userId, q, page, size });
        setRows(res.content);
      } catch (e) {
        console.error("Error cargando trámites del analista:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnalyst, user?.userId, q, page, size]);

  // -------- Handlers --------
  const handleSelect = async (folio: string) => {
    if (openFolio === folio) {
      setOpenFolio(null);
      setSelected(null);
      return;
    }
    setLoadingDetail(true);
    setOpenFolio(folio);
    try {
      const detalle = await getTramiteByFolio(folio);
      setSelected(detalle);
    } catch (err) {
      console.error("Error obteniendo detalle:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const [editingFolio, setEditingFolio] = useState<string | null>(null);
  const [editingStatusFolio, setEditingStatusFolio] = useState<string | null>(null);
  const [assigningFolio, setAssigningFolio] = useState<string | null>(null);
  const [rowSaving, setRowSaving] = useState<string | null>(null);

  // Cambiar tipo (solo líderes/admin)
  const handleTypeChange = async (folio: string, newTypeId: number) => {
    if (!canChangeType) return;
    try {
      await changeTramiteType(folio, newTypeId, "Cambio de tipo desde la tabla");
      setEditingFolio(null);
      fetchList();
    } catch {
      alert("No se pudo cambiar el tipo");
    }
  };

  // Cambiar estatus (analista, líder, admin)
  const handleStatusChange = async (folio: string, newStatusId: number) => {
    if (!user || !canChangeStatus) return;
    try {
      await changeTramiteStatus(folio, newStatusId, user.userId, user.name);
      // update optimista simple
      setRows((prev) =>
        prev.map((r) =>
          r.folio === folio ? { ...r, statusId: newStatusId, statusDesc: newStatusId === 2 ? "ASIGNADO" : "RECIBIDO" } : r
        )
      );
      setEditingStatusFolio(null);
    } catch {
      alert("No se pudo cambiar el estatus");
    }
  };

  // ⭐ Asignar/Cambiar analista — optimista + reconciliación
  const handleAssign = async (folio: string, assigneeUserId: string) => {
    if (!canAssign) return;
    try {
      setRowSaving(folio);
      const chosenName = analysts.find((a) => a.userId === assigneeUserId)?.name ?? assigneeUserId;

      // 1) Optimista
      setRows((prev) =>
        prev.map((r) =>
          r.folio === folio
            ? {
                ...r,
                assignedTo: assigneeUserId,
                assignedToName: chosenName,
                assignedBy: user?.userId ?? r.assignedBy,
                assignedByName: user?.name ?? r.assignedByName,
                assignedAt: new Date().toISOString(),
                statusId: 2,
                statusDesc: "ASIGNADO",
              }
            : r
        )
      );

      // 2) PATCH + reconciliación
      const res = await assignTramite(folio, assigneeUserId);
      setRows((prev) =>
        prev.map((r) =>
          r.folio === folio
            ? {
                ...r,
                assignedTo: res?.assigneeUserId ?? r.assignedTo,
                assignedToName: res?.assigneeName ?? r.assignedToName ?? chosenName,
                assignedBy: res?.assignedBy ?? r.assignedBy,
                assignedByName: res?.assignedByName ?? r.assignedByName ?? user?.name,
                assignedAt: res?.assignedAt ?? r.assignedAt,
                statusId: 2,
                statusDesc: "ASIGNADO",
              }
            : r
        )
      );
    } catch (e) {
      console.error(e);
      alert("No se pudo asignar el trámite.");
    } finally {
      setAssigningFolio(null);
      setRowSaving(null);
    }
  };

  // 🧪 Hidratar "Asignó" si el listado no lo trae
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
            setRows((prev) =>
              prev.map((r) =>
                r.folio === row.folio
                  ? {
                      ...r,
                      assignedBy: r.assignedBy ?? ev.changedBy,
                      assignedByName: r.assignedByName ?? ev.changedBy,
                      assignedToName: r.assignedToName ?? r.assignedTo ?? null,
                    }
                  : r
              )
            );
          }
        } catch (e) {
          console.error("No se pudo hidratar asignación de", row.folio, e);
        }
      }
    })();
  }, [rows, setRows]);

  return (
    <section className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Asignaciones</h1>
          <p className={styles.subtitle}>Panel institucional de distribución y seguimiento de trámites.</p>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.search}>
            <input
              placeholder="Buscar folio / solicitante"
              value={q}
              onChange={(e) => {
                setPage(0);
                setQ(e.target.value);
              }}
            />
          </div>
          <label className={styles.select}>
            <span>Pág.</span>
            <select
              value={size}
              onChange={(e) => {
                setPage(0);
                setSize(Number(e.target.value));
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>{n}/pág</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Tabla */}
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
                <th>Docs</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className={styles.loadingRow}>Cargando…</td></tr>
              ) : rows.length ? (
                rows.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr>
                      <td className={styles.clickable} onClick={() => handleSelect(t.folio)}>
                        <span>{t.folio}</span>
                      </td>

                      {/* Tipo (solo líderes/admin pueden editar) */}
                      <td>
                        {!canChangeType ? (
                          <span className={styles.text}>{t.tramiteTypeDesc}</span>
                        ) : editingFolio === t.folio ? (
                          <select
                            autoFocus
                            className={styles.input}
                            value={t.tramiteTypeId}
                            onChange={(e) => handleTypeChange(t.folio, Number(e.target.value))}
                            onBlur={() => setEditingFolio(null)}
                          >
                            {tramiteTypes.map((tp) => (
                              <option key={tp.id} value={tp.id}>{tp.descArea}</option>
                            ))}
                          </select>
                        ) : (
                          <button className={styles.linkBtn} onClick={() => setEditingFolio(t.folio)}>
                            {t.tramiteTypeDesc}
                          </button>
                        )}
                      </td>

                      {/* Estatus (analista también puede) */}
                      <td>
                        {!canChangeStatus ? (
                          <span className={`${styles.badge} ${t.statusId === 2 ? styles.badgeAssigned : styles.badgeReceived}`}>
                            {t.statusDesc}
                          </span>
                        ) : editingStatusFolio === t.folio ? (
                          <select
                            autoFocus
                            className={styles.input}
                            value={t.statusId}
                            onChange={(e) => handleStatusChange(t.folio, Number(e.target.value))}
                            onBlur={() => setEditingStatusFolio(null)}
                          >
                            <option value={1}>RECIBIDO</option>
                            <option value={2}>ASIGNADO</option>
                            <option value={3}>TERMINADO</option>
                            <option value={4}>ENTREGADO</option>
                          </select>
                        ) : (
                          <button
                            className={`${styles.badgeBtn} ${t.statusId === 2 ? styles.badgeAssigned : styles.badgeReceived}`}
                            onClick={() => setEditingStatusFolio(t.folio)}
                            title="Cambiar estatus"
                          >
                            {t.statusDesc}
                          </button>
                        )}
                      </td>

                      {/* Asignado a (solo líderes/admin) */}
                      <td>
                        {(() => {
                          const label = t.assignedToName ?? t.assignedTo ?? "—";
                          if (!canAssign || !isLeader || !defaultSub) {
                            return <span className={styles.text}>{label}</span>;
                          }
                          if (assigningFolio === t.folio) {
                            return (
                              <select
                                autoFocus
                                className={styles.input}
                                disabled={rowSaving === t.folio}
                                defaultValue={t.assignedTo ?? ""}
                                onBlur={() => setAssigningFolio(null)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val) handleAssign(t.folio, val);
                                }}
                              >
                                <option value="" disabled>Selecciona analista…</option>
                                {analysts.map((a) => (
                                  <option key={a.userId} value={a.userId}>{a.name}</option>
                                ))}
                              </select>
                            );
                          }
                          return t.assignedTo ? (
                            <span className={styles.text}>
                              {label}
                              <button
                                className={styles.linkBtn}
                                onClick={() => setAssigningFolio(t.folio)}
                                title="Cambiar asignación"
                              >
                                cambiar
                              </button>
                            </span>
                          ) : (
                            <button
                              className={styles.linkBtn}
                              disabled={rowSaving === t.folio}
                              onClick={() => setAssigningFolio(t.folio)}
                              title="Asignar analista"
                            >
                              Asignar…
                            </button>
                          );
                        })()}
                      </td>

                      {/* Asignó */}
                      <td>
                        <span className={styles.text}>{t.assignedByName ?? t.assignedBy ?? "—"}</span>
                        {t.assignedAt && <small className={styles.muted}>{new Date(t.assignedAt).toLocaleString()}</small>}
                      </td>

                      {/* Solicitante / Creado / Docs */}
                      <td className={styles.text}>{t.requesterId}{t.requesterName ? ` — ${t.requesterName}` : ""}</td>
                      <td className={styles.text}>{new Date(t.createdAt).toLocaleString()}</td>
                      <td className={styles.textCenter}>{t.docsCount}</td>
                    </tr>

                    {/* Detalle expandible */}
                    {openFolio === t.folio && selected && (
                      <tr className={styles.detailRow}>
                        <td colSpan={8}>
                          {loadingDetail ? (
                            <div className={styles.detailBox}>Cargando detalle…</div>
                          ) : (
                            <div className={styles.detailBox}>
                              <h4 className={styles.detailTitle}>Detalle del trámite</h4>
                              <div className={styles.detailGrid}>
                                <p><b>Folio:</b> {selected.history.folio}</p>
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
                                              {h.fromStatus} → {h.toStatus} <span className={styles.muted}>| {h.comment}</span>
                                            </div>
                                            <small className={styles.muted}>
                                              Por {h.changedBy} · {new Date(h.changedAt).toLocaleString()}
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
                ))
              ) : (
                <tr><td colSpan={8} className={styles.empty}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className={styles.pagination}>
          <span className={styles.muted}>Total: {total}</span>
          <div className={styles.pager}>
            <button className={styles.pageBtn} disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>«</button>
            <span className={styles.pageNumber}>{page + 1}</span>
            <button className={styles.pageBtn} onClick={() => setPage((p) => p + 1)}>»</button>
          </div>
        </div>
      </div>
    </section>
  );
}
