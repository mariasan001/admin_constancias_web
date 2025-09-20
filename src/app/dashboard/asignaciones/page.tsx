"use client";

import styles from "./asignaciones.module.css";
import { useAuthContext } from "@/context/AuthContext";
import { useTramites } from "./hooks/useTramites";
import { useState, useEffect } from "react";
import {
  getTramiteByFolio,
  changeTramiteType,
  changeTramiteStatus,
  listTramiteTypes,
} from "@/features/tramites/tramite.service";
import type { TramiteFull } from "@/features/tramites/tramite.model";
import React from "react";

type TramiteType = {
  id: number;
  descArea: string;
};

export default function AsignacionesPage() {
  const { user } = useAuthContext();
  const isAdmin = user?.roles?.some((r) => r.description === "ADMIN");
  const defaultSub = !isAdmin ? user?.subWorkUnit?.id : undefined;

  const {
    rows,
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

  // Estado de detalle
  const [selected, setSelected] = useState<TramiteFull | null>(null);
  const [openFolio, setOpenFolio] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Estado de edición
  const [tramiteTypes, setTramiteTypes] = useState<TramiteType[]>([]);
  const [editingFolio, setEditingFolio] = useState<string | null>(null);
  const [editingStatusFolio, setEditingStatusFolio] = useState<string | null>(null);

  useEffect(() => {
    const loadTypes = async () => {
      try {
        const types = await listTramiteTypes();
        setTramiteTypes(types);
      } catch (err) {
        console.error("Error cargando tipos de trámite:", err);
      }
    };
    loadTypes();
  }, []);

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

  const handleTypeChange = async (folio: string, newTypeId: number) => {
    try {
      await changeTramiteType(folio, newTypeId, "Cambio de tipo desde la tabla");
      setEditingFolio(null);
      fetchList();
    } catch (e) {
      console.error("Error cambiando tipo:", e);
      alert("No se pudo cambiar el tipo");
    }
  };

  const handleStatusChange = async (folio: string, newStatusId: number) => {
    if (!user) return;
    try {
      await changeTramiteStatus(
        folio,
        newStatusId,
        user.userId, // 👈 ID del usuario
        user.name           // 👈 Nombre del usuario
      );
      setEditingStatusFolio(null);
      fetchList();
    } catch (e) {
      console.error("Error cambiando estatus:", e);
      alert("No se pudo cambiar el estatus");
    }
  };

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
              <th>Solicitante</th>
              <th>Creado</th>
              <th>Docs</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Cargando…</td>
              </tr>
            ) : rows.length ? (
              rows.map((t) => (
                <React.Fragment key={t.id}>
                  <tr>
                    {/* 🔗 Folio clickable */}
                    <td
                      className={styles.clickable}
                      onClick={() => handleSelect(t.folio)}
                    >
                      {t.folio}
                    </td>

                    {/* 🔽 Tipo editable */}
                    <td>
                      {editingFolio === t.folio ? (
                        <select
                          value={t.tramiteTypeId}
                          onChange={(e) =>
                            handleTypeChange(t.folio, Number(e.target.value))
                          }
                          onBlur={() => setEditingFolio(null)}
                        >
                          {tramiteTypes.map((tp) => (
                            <option key={tp.id} value={tp.id}>
                              {tp.descArea}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={styles.clickable}
                          onClick={() => setEditingFolio(t.folio)}
                        >
                          {t.tramiteTypeDesc}
                        </span>
                      )}
                    </td>

                    {/* 🔽 Estatus editable */}
                    <td>
                      {editingStatusFolio === t.folio ? (
                        <select
                          value={t.statusId}
                          onChange={(e) =>
                            handleStatusChange(t.folio, Number(e.target.value))
                          }
                          onBlur={() => setEditingStatusFolio(null)}
                        >
                          <option value={1}>RECIBIDO</option>
                          <option value={2}>ASIGNADO</option>
                        </select>
                      ) : (
                        <span
                          className={styles.clickable}
                          onClick={() => setEditingStatusFolio(t.folio)}
                        >
                          {t.statusDesc}
                        </span>
                      )}
                    </td>

                    <td>{t.requesterId}</td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.docsCount}</td>
                  </tr>

                  {/* ⬇️ Render detalle debajo */}
                  {openFolio === t.folio && selected && (
                    <tr className={styles.detailRow}>
                      <td colSpan={6}>
                        {loadingDetail ? (
                          <p>Cargando detalle…</p>
                        ) : (
                          <div className={styles.detailBox}>
                            <h4>Detalle del trámite</h4>
                            <p>
                              <b>Folio:</b> {selected.history.folio}
                            </p>
                            <p>
                              <b>Tipo:</b> {selected.history.tramiteType}
                            </p>
                            <p>
                              <b>Solicitante:</b> {selected.history.userName} (
                              {selected.history.userId})
                            </p>
                            <p>
                              <b>Estatus actual:</b>{" "}
                              {selected.history.currentStatus}
                            </p>
                            <p>
                              <b>Creado:</b>{" "}
                              {new Date(
                                selected.history.createdAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6}>Sin resultados</td>
              </tr>
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
            <option key={n} value={n}>
              {n}/pág
            </option>
          ))}
        </select>
        <button disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
          «
        </button>
        <span>{page + 1}</span>
        <button onClick={() => setPage((p) => p + 1)}>»</button>
      </div>
    </section>
  );
}
