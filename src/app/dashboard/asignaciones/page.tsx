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
  searchTramites, // 👈 para el filtro especial de ANALISTA
} from "@/features/tramites/tramite.service";
import type {
  TramiteFull,
  TramiteType,
  Analyst,
} from "@/features/tramites/tramite.model";

export default function AsignacionesPage() {
  const { user } = useAuthContext();
  const isAdmin   = user?.roles?.some((r) => r.description === "ADMIN");
  const isLeader  = user?.roles?.some((r) => r.description === "LIDER");
  const isAnalyst = user?.roles?.some((r) => r.id === 3 || r.description === "ANALISTA") ?? false;
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

  // -------- Editar tipo/estatus --------
  const [tramiteTypes, setTramiteTypes] = useState<TramiteType[]>([]);
  const [editingFolio, setEditingFolio] = useState<string | null>(null);
  const [editingStatusFolio, setEditingStatusFolio] = useState<string | null>(null);

  // -------- Asignación --------
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [assigningFolio, setAssigningFolio] = useState<string | null>(null);
  const [rowSaving, setRowSaving] = useState<string | null>(null);

  // Cargar catálogos
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

  // Cargar analistas por subárea (solo LÍDER)
  useEffect(() => {
    if (!isLeader || !defaultSub) return;
    (async () => {
      try {
        const list = await listAnalystsBySubarea(defaultSub);
        setAnalysts(list);
      } catch (e) {
        console.error("No se pudieron cargar analistas:", e);
      }
    })();
  }, [isLeader, defaultSub]);

  // 🔒 Vista de ANALISTA: traer SOLO lo asignado a él/ella desde el backend
  useEffect(() => {
    if (!isAnalyst || !user?.userId) return;
    (async () => {
      try {
        const res = await searchTramites({
          assignedTo: user.userId, // 👈 clave
          q,
          page,
          size,
          // subWorkUnitId: opcional; si tu backend usa solo assignedTo basta esto
        });
        setRows(res.content);
        // Si quieres mantener la paginación real del backend:
        // (si el backend ya filtra por assignedTo)
        // @ts-ignore: totalElements existe en tu TramitePage
        // setTotal(res.totalElements);
      } catch (e) {
        console.error("Error cargando trámites del analista:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnalyst, user?.userId, q, page, size]);

  // Abrir/cerrar detalle
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

  // Cambiar tipo
  const handleTypeChange = async (folio: string, newTypeId: number) => {
    try {
      await changeTramiteType(folio, newTypeId, "Cambio de tipo desde la tabla");
      setEditingFolio(null);
      fetchList();
    } catch {
      alert("No se pudo cambiar el tipo");
    }
  };

  // Cambiar estatus
  const handleStatusChange = async (folio: string, newStatusId: number) => {
    if (!user) return;
    try {
      await changeTramiteStatus(folio, newStatusId, user.userId, user.name);
      setEditingStatusFolio(null);
      fetchList();
    } catch {
      alert("No se pudo cambiar el estatus");
    }
  };

  // ⭐ Asignar/Cambiar analista — optimista + reconciliación con respuesta PATCH
  const handleAssign = async (folio: string, assigneeUserId: string) => {
    try {
      setRowSaving(folio);

      // 1) Optimista inmediato
      const chosenName =
        analysts.find((a) => a.userId === assigneeUserId)?.name ?? assigneeUserId;

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

      // 2) PATCH + reconciliación (sin refetch pesado)
      const res = await assignTramite(folio, assigneeUserId);
      // Ajusta estas keys si tu backend usa otros nombres:
      // { assigneeUserId, assigneeName, assignedBy, assignedByName, assignedAt }
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
      // Si quieres revertir a estado real:
      // await fetchList();
    } finally {
      setAssigningFolio(null);
      setRowSaving(null);
    }
  };

  // 🧪 Hidratar "Asignó" desde /full cuando el listado no lo trae (si ya viene, esto no hace nada)
  const hydratedFoliosRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const targets = rows.filter(
      (r) =>
        r.statusId === 2 &&        // ASIGNADO
        r.assignedAt &&            // hay fecha
        !r.assignedBy &&           // falta "quién asignó"
        !hydratedFoliosRef.current.has(r.folio)
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
      <h1 className={styles.title}>Asignaciones</h1>

      {/* 🔍 Filtros */}
      <div className={styles.filters}>
        <input
          placeholder="Buscar folio / solicitante"
          value={q}
          onChange={(e) => {
            setPage(0);
            setQ(e.target.value);
          }}
        />
      </div>

      {/* 📋 Tabla */}
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
              <tr><td colSpan={8}>Cargando…</td></tr>
            ) : rows.length ? (
              rows.map((t) => (
                <React.Fragment key={t.id}>
                  <tr>
                    <td className={styles.clickable} onClick={() => handleSelect(t.folio)}>{t.folio}</td>

                    {/* Tipo */}
                    <td>
                      {editingFolio === t.folio ? (
                        <select
                          value={t.tramiteTypeId}
                          onChange={(e) => handleTypeChange(t.folio, Number(e.target.value))}
                          onBlur={() => setEditingFolio(null)}
                        >
                          {tramiteTypes.map((tp) => (
                            <option key={tp.id} value={tp.id}>{tp.descArea}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={styles.clickable} onClick={() => setEditingFolio(t.folio)}>
                          {t.tramiteTypeDesc}
                        </span>
                      )}
                    </td>

                    {/* Estatus */}
                    <td>
                      {editingStatusFolio === t.folio ? (
                        <select
                          value={t.statusId}
                          onChange={(e) => handleStatusChange(t.folio, Number(e.target.value))}
                          onBlur={() => setEditingStatusFolio(null)}
                        >
                          <option value={1}>RECIBIDO</option>
                          <option value={2}>ASIGNADO</option>
                        </select>
                      ) : (
                        <span className={styles.clickable} onClick={() => setEditingStatusFolio(t.folio)}>
                          {t.statusDesc}
                        </span>
                      )}
                    </td>

                    {/* Asignado a */}
                    <td>
                      {(() => {
                        const assignedLabel = t.assignedToName ?? t.assignedTo ?? "—";

                        // Analista y usuarios no-líder: solo ven el texto
                        if (!isLeader || !defaultSub || isAnalyst) {
                          return <span>{assignedLabel}</span>;
                        }

                        // Líder en modo selección
                        if (assigningFolio === t.folio) {
                          return (
                            <select
                              autoFocus
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

                        // Líder con asignación: mostrar texto + acción "cambiar"
                        return t.assignedTo ? (
                          <span>
                            {assignedLabel}
                            <button
                              className={styles.linkBtn}
                              onClick={() => setAssigningFolio(t.folio)}
                              style={{ marginLeft: 6 }}
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
                      <span>{t.assignedByName ?? t.assignedBy ?? "—"}</span>
                      {t.assignedAt && (
                        <small style={{ display: "block", opacity: 0.7 }}>
                          {new Date(t.assignedAt).toLocaleString()}
                        </small>
                      )}
                    </td>

                    {/* Solicitante / Creado / Docs */}
                    <td>{t.requesterId}{t.requesterName ? ` — ${t.requesterName}` : ""}</td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.docsCount}</td>
                  </tr>

                  {/* Detalle expandible */}
                  {openFolio === t.folio && selected && (
                    <tr className={styles.detailRow}>
                      <td colSpan={8}>
                        {loadingDetail ? (
                          <p>Cargando detalle…</p>
                        ) : (
                          <div className={styles.detailBox}>
                            <h4>Detalle del trámite</h4>
                            <p><b>Folio:</b> {selected.history.folio}</p>
                            <p><b>Tipo:</b> {selected.history.tramiteType}</p>
                            <p><b>Solicitante:</b> {selected.history.userName} ({selected.history.userId})</p>
                            <p><b>Estatus actual:</b> {selected.history.currentStatus}</p>
                            <p><b>Creado:</b> {new Date(selected.history.createdAt).toLocaleString()}</p>

                            <h5>Historial</h5>
                            {selected.history.history?.length ? (
                              <ul>
                                {selected.history.history.map((h, i) => (
                                  <li key={i}>
                                    {h.fromStatus} → {h.toStatus} | {h.comment}
                                    <br />
                                    <small>Por {h.changedBy} el {new Date(h.changedAt).toLocaleString()}</small>
                                  </li>
                                ))}
                              </ul>
                            ) : <p>Sin historial</p>}

                            <h5>Documentos</h5>
                            {selected.docs?.length ? (
                              <ul>
                                {selected.docs.map((d) => (
                                  <li key={d.id}>
                                    {d.docTypeDesc} – <a href={d.downloadUrl} target="_blank" rel="noreferrer">{d.originalName}</a> ({(d.sizeBytes / 1024).toFixed(1)} KB)
                                  </li>
                                ))}
                              </ul>
                            ) : <p>Sin documentos</p>}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr><td colSpan={8}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📑 Paginación */}
      <div className={styles.pagination}>
        <span>Total: {total}</span>
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
        <button disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>«</button>
        <span>{page + 1}</span>
        <button onClick={() => setPage((p) => p + 1)}>»</button>
      </div>
    </section>
  );
}
