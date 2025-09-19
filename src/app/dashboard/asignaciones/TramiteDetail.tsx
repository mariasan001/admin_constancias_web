"use client";

import { useState, useEffect } from "react";

import styles from "./asignaciones.module.css";
import { useAuthContext } from "@/context/AuthContext";
import { changeTramiteType, listTramiteTypes } from "@/features/tramites/tramite.service";

type TramiteDetailProps = {
  tramite: any;
  onUpdated: () => void;
};

export default function TramiteDetail({ tramite, onUpdated }: TramiteDetailProps) {
  const { user } = useAuthContext();
  const isLeader = user?.roles?.some(r => r.description === "LIDER");

  const [types, setTypes] = useState<{ id: number; descArea: string }[]>([]);
  const [selected, setSelected] = useState<number>(tramite.tramiteTypeId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLeader) {
      listTramiteTypes().then(setTypes);
    }
  }, [isLeader]);

  const handleChange = async () => {
    if (!selected || selected === tramite.tramiteTypeId) return;
    setLoading(true);
    try {
      await changeTramiteType(tramite.folio, selected, "Actualización por corrección de clasificación");
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.detailBox}>
      <h3>Detalle del Trámite</h3>
      <p><b>Folio:</b> {tramite.folio}</p>
      <p><b>Tipo actual:</b> {tramite.tramiteTypeDesc}</p>
      <p><b>Estatus:</b> {tramite.currentStatus}</p>
      <p><b>Solicitante:</b> {tramite.userName} ({tramite.userId})</p>
      <p><b>Fecha creación:</b> {new Date(tramite.createdAt).toLocaleString()}</p>

      {isLeader && (
        <div className={styles.changeBox}>
          <label>Cambiar tipo de trámite:</label>
          <select value={selected} onChange={(e)=>setSelected(Number(e.target.value))}>
            {types.map(t => (
              <option key={t.id} value={t.id}>{t.descArea}</option>
            ))}
          </select>
          <button disabled={loading} onClick={handleChange}>
            {loading ? "Guardando..." : "Aplicar cambio"}
          </button>
        </div>
      )}
    </div>
  );
}
